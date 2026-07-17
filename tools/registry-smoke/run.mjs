#!/usr/bin/env node
/**
 * Registry-driven fixture smoke.
 *
 * WHY THIS EXISTS, AND WHY tools/template-smoke IS NOT ENOUGH
 *
 * template-smoke typechecks the whole templates tree with every hook, theme file and
 * component present at once. That proves the tree compiles — it cannot prove a registry
 * entry DECLARES what its component actually imports. A component importing
 * `@/hooks/useColor` while its registry entry forgets `hooks: ['useColor']` compiles
 * perfectly in the whole tree and installs BROKEN into a user's project. The registry drift
 * is invisible to the exact check that exists to catch it.
 *
 * So: build the project a `bna-ui add <component>` user would actually get. For every
 * component, resolve the closure its registry entry DECLARES (registryDependencies + hooks
 * + theme, transitively), copy only those files into a fresh fixture under the `@/*` layout,
 * and typecheck that. An imported-but-undeclared file is simply not there — TS reports a
 * module-not-found and the fixture goes RED.
 *
 * The check is only worth its runtime if it can actually fail, so `--self-test` proves it:
 * it drops one declared dependency in-memory and requires the fixture to go RED, then
 * restores it and requires GREEN. See runSelfTest below.
 *
 *   node tools/registry-smoke/run.mjs [--self-test] [--only <name>] [--keep]
 */

import { execFileSync } from "node:child_process"
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { existsSync } from "node:fs"
import { availableParallelism } from "node:os"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, "../..")
const BASE_TSCONFIG = join(HERE, "tsconfig.fixture.base.json")

const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const option = (name) => {
  const i = args.indexOf(name)
  return i === -1 ? undefined : args[i + 1]
}

/* -------------------------------------------------------------------------- */
/* Loading the registry                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The registry is TypeScript whose imports carry `.js` specifiers, so Node cannot import it
 * directly. Compile it to a scratch dir and import that — always from src/, never from a
 * possibly-stale dist/, or the smoke would audit a tree nobody ships.
 */
async function loadRegistry(scratch) {
  const outDir = join(scratch, "registry-js")
  execFileSync(
    "npx",
    [
      "tsc",
      join(REPO, "src/registry/index.ts"),
      "--outDir",
      outDir,
      "--rootDir",
      join(REPO, "src/registry"),
      "--module",
      "esnext",
      "--moduleResolution",
      "node",
      "--target",
      "es2020",
      "--skipLibCheck",
      "--types",
      "node",
    ],
    { cwd: REPO, stdio: "pipe" },
  )
  // Emitted files are `.js` with ESM syntax; without this Node reads them as CommonJS.
  writeFileSync(join(outDir, "package.json"), JSON.stringify({ type: "module" }))
  return import(pathToFileURL(join(outDir, "index.js")).href)
}

/* -------------------------------------------------------------------------- */
/* The declared closure                                                       */
/* -------------------------------------------------------------------------- */

/** Every edge kind an entry can declare. All three name other REGISTRY entries. */
const declaredEdges = (entry) => [
  ...(entry.registryDependencies ?? []),
  ...(entry.hooks ?? []),
  ...(entry.theme ?? []),
]

/**
 * Transitive closure over ALL declared edge kinds.
 *
 * `skipDirect` drops one edge from the ROOT only — that is the self-test's scalpel, and it
 * is deliberately not applied deeper: removing an edge everywhere would prove nothing about
 * whether the root declared it.
 */
function closureOf(REGISTRY, root, { skipDirect } = {}) {
  const seen = new Set()
  const missing = new Set()

  const walk = (name, isRoot) => {
    if (seen.has(name)) return
    const entry = REGISTRY[name]
    if (!entry) {
      missing.add(name)
      return
    }
    seen.add(name)
    for (const dep of declaredEdges(entry)) {
      if (isRoot && dep === skipDirect) continue
      walk(dep, false)
    }
  }

  walk(root, true)
  return { names: seen, missing }
}

const filesOf = (REGISTRY, names) => [...names].flatMap((name) => REGISTRY[name]?.files ?? [])

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Materialize the closure as the project layout `@/*` points at, and nothing else. What is
 * NOT copied is the whole point: an undeclared import has no file to resolve to.
 */
function buildFixture(root, files) {
  rmSync(root, { recursive: true, force: true })
  mkdirSync(root, { recursive: true })

  for (const file of files) {
    const source = join(REPO, file.path)
    if (!existsSync(source)) throw new Error(`registry points at a missing file: ${file.path}`)
    const target = join(root, file.target)
    mkdirSync(dirname(target), { recursive: true })
    cpSync(source, target)
  }

  // Third-party types (react, react-native, expo-*) resolve by walking up from the fixture;
  // in tmp that walk finds nothing, so hand it the repo's node_modules.
  symlinkSync(join(REPO, "node_modules"), join(root, "node_modules"), "junction")

  writeFileSync(
    join(root, "tsconfig.json"),
    JSON.stringify(
      {
        extends: BASE_TSCONFIG,
        compilerOptions: { baseUrl: ".", paths: { "@/*": ["./*"] } },
        include: ["**/*.ts", "**/*.tsx"],
      },
      null,
      2,
    ),
  )
}

/** Returns null when the fixture typechecks, else tsc's report. */
function typecheckFixture(root) {
  try {
    execFileSync("npx", ["tsc", "--noEmit", "-p", join(root, "tsconfig.json")], {
      cwd: root,
      stdio: "pipe",
      encoding: "utf8",
    })
    return null
  } catch (error) {
    return `${error.stdout ?? ""}${error.stderr ?? ""}`.trim()
  }
}

function checkComponent(REGISTRY, scratch, name, { skipDirect } = {}) {
  const { names, missing } = closureOf(REGISTRY, name, { skipDirect })
  const root = join(scratch, "fixtures", name.replace(/[^\w.-]/g, "_"))
  buildFixture(root, filesOf(REGISTRY, names))
  const failure = typecheckFixture(root)
  return { name, closure: names, missing, failure }
}

/* -------------------------------------------------------------------------- */
/* Self-test                                                                  */
/* -------------------------------------------------------------------------- */

/** The `@/...` specifiers a dependency's files are imported by. */
const specifiersFor = (REGISTRY, dep) =>
  (REGISTRY[dep]?.files ?? []).map((file) => `@/${file.target.replace(/\.(tsx?|jsx?)$/, "")}`)

/**
 * Find a (component, dependency) pair whose removal is guaranteed to break the fixture:
 * the dependency must leave the closure entirely when the direct edge goes (otherwise the
 * removal is vacuous — `input` still reaches `text` through `icon`), and the component must
 * genuinely import it (otherwise nothing would fail to resolve).
 */
function findSelfTestTarget(REGISTRY, components) {
  for (const name of components) {
    const entry = REGISTRY[name]
    const source = entry.files.map((file) => readFileSync(join(REPO, file.path), "utf8")).join("\n")
    for (const dep of entry.registryDependencies ?? []) {
      const { names } = closureOf(REGISTRY, name, { skipDirect: dep })
      if (names.has(dep)) continue
      const imported = specifiersFor(REGISTRY, dep).some((s) => source.includes(s))
      if (imported) return { name, dep }
    }
  }
  return null
}

/**
 * Prove the harness can fail. A smoke that cannot go RED is not a gate — it is a green light
 * with extra steps, which is exactly what tools/template-smoke turned out to be.
 */
function runSelfTest(REGISTRY, scratch, components) {
  const target = findSelfTestTarget(REGISTRY, components)
  if (!target) {
    console.error("self-test: no component declares a uniquely-reachable, imported dependency")
    console.error("  → the harness cannot be shown to fail, so it cannot be trusted to pass")
    return false
  }

  const { name, dep } = target
  console.log(`self-test: dropping registryDependency '${dep}' from '${name}'`)

  // Assert the mutation actually shrinks the closure — a silent no-op would "prove" nothing.
  const full = closureOf(REGISTRY, name)
  const reduced = closureOf(REGISTRY, name, { skipDirect: dep })
  if (!full.names.has(dep) || reduced.names.has(dep)) {
    console.error(`self-test: dropping '${dep}' did not remove it from the closure — vacuous`)
    return false
  }

  const mutated = checkComponent(REGISTRY, scratch, name, { skipDirect: dep })
  if (!mutated.failure) {
    console.error(`self-test: FAILED — '${name}' still typechecked without '${dep}'`)
    console.error("  → an undeclared dependency would not be caught; the smoke proves nothing")
    return false
  }
  const firstError = mutated.failure.split("\n")[0]
  console.log(`self-test: RED as required — ${firstError}`)

  const restored = checkComponent(REGISTRY, scratch, name)
  if (restored.failure) {
    console.error(`self-test: FAILED — '${name}' does not typecheck with '${dep}' restored:`)
    console.error(restored.failure)
    return false
  }
  console.log(`self-test: GREEN once '${dep}' is restored — the fixture tracks the declaration`)
  return true
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

const scratch = mkdtempSync(join(tmpdir(), "bna-registry-smoke-"))

try {
  const { REGISTRY } = await loadRegistry(scratch)

  const only = option("--only")
  const components = Object.values(REGISTRY)
    .filter((entry) => entry.type === "registry:ui")
    .map((entry) => entry.name)
    .filter((name) => !only || name === only)
    .sort()

  if (components.length === 0) {
    console.error(only ? `no registry:ui component named '${only}'` : "no registry:ui components")
    process.exit(1)
  }

  // Say what is NOT covered rather than let the count imply the registry is fully checked.
  const skipped = Object.values(REGISTRY).filter((e) => e.type !== "registry:ui").length
  console.log(
    `registry-smoke: ${components.length} registry:ui components ` +
      `(${skipped} non-ui entries — examples, hooks and theme files — are checked only as ` +
      `part of the closures that declare them)`,
  )

  if (flag("--self-test")) {
    const ok = runSelfTest(REGISTRY, scratch, components)
    process.exit(ok ? 0 : 1)
  }

  const failures = []
  const parallelism = Math.max(1, Math.min(8, availableParallelism() - 1))
  const queue = [...components]

  const worker = async () => {
    for (let name = queue.shift(); name; name = queue.shift()) {
      const result = checkComponent(REGISTRY, scratch, name)
      if (result.missing.size > 0) {
        failures.push(
          `${name}: declares dependencies that are not in the registry: ` +
            `${[...result.missing].join(", ")}`,
        )
        console.log(`  ✗ ${name} — dangling declaration`)
        continue
      }
      if (result.failure) {
        failures.push(`${name}:\n${result.failure}`)
        console.log(`  ✗ ${name}`)
        continue
      }
      console.log(`  ✓ ${name} (${result.closure.size} declared)`)
    }
  }

  await Promise.all(Array.from({ length: parallelism }, worker))

  if (failures.length > 0) {
    console.error(`\n${failures.length}/${components.length} components have registry drift:\n`)
    for (const failure of failures) console.error(`${failure}\n`)
    console.error(
      "Each component above imports something its registry entry does not declare, or\n" +
        "declares something the registry does not define. `bna-ui add <component>` would\n" +
        "install it broken. Fix the entry in src/registry/, not this check.",
    )
    process.exit(1)
  }

  console.log(`\nregistry-smoke: ${components.length}/${components.length} closures complete`)
} finally {
  if (flag("--keep")) console.log(`registry-smoke: fixtures kept at ${scratch}`)
  else rmSync(scratch, { recursive: true, force: true })
}
