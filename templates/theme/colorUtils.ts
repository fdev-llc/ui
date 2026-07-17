const HEX_SHORT = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i
const HEX_SHORT_ALPHA = /^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])$/i
const HEX_LONG = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i
const HEX_LONG_ALPHA = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i
const RGB_FN = /^rgba?\(([^)]*)\)$/i

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

/**
 * Applies `alpha` to a color, replacing any alpha the color already carries.
 *
 * Supersedes the `color + "20"` hex-suffix idiom, which silently corrupts any
 * palette entry that is not exactly #rrggbb: appending to an #rrggbbaa token
 * yields a 10-digit string and appending to an rgba() string yields nonsense.
 *
 * Accepts #rgb, #rgba, #rrggbb, #rrggbbaa, rgb(...) and rgba(...) (comma or
 * slash separated, percent or 0-255 channels). Always re-emits rgba().
 *
 * @throws TypeError when `color` cannot be parsed or `alpha` is not finite.
 */
export function withAlpha(color: string, alpha: number): string {
  if (typeof alpha !== "number" || !Number.isFinite(alpha)) {
    throw new TypeError(`withAlpha: alpha must be a finite number, got ${String(alpha)}`)
  }
  if (typeof color !== "string") {
    throw new TypeError(`withAlpha: color must be a string, got ${typeof color}`)
  }

  const a = clamp01(alpha)
  const input = color.trim()

  const short = HEX_SHORT.exec(input) ?? HEX_SHORT_ALPHA.exec(input)
  if (short) {
    const [r, g, b] = [short[1], short[2], short[3]].map((c) => parseInt(c + c, 16))
    return `rgba(${r}, ${g}, ${b}, ${a})`
  }

  const long = HEX_LONG.exec(input) ?? HEX_LONG_ALPHA.exec(input)
  if (long) {
    const [r, g, b] = [long[1], long[2], long[3]].map((c) => parseInt(c, 16))
    return `rgba(${r}, ${g}, ${b}, ${a})`
  }

  const fn = RGB_FN.exec(input)
  if (fn) {
    // rgb() accepts both "r, g, b" and "r g b / a" forms; alpha is replaced either way.
    const parts = fn[1]
      .replace(/\//g, " ")
      .split(/[,\s]+/)
      .map((p) => p.trim())
      .filter(Boolean)
    if (parts.length < 3) {
      throw new TypeError(`withAlpha: unparseable color "${color}"`)
    }
    const channels = parts.slice(0, 3).map((p) => {
      const isPct = p.endsWith("%")
      const n = Number.parseFloat(isPct ? p.slice(0, -1) : p)
      if (!Number.isFinite(n)) {
        throw new TypeError(`withAlpha: unparseable color "${color}"`)
      }
      return Math.round(clamp01((isPct ? n / 100 : n / 255)) * 255)
    })
    return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${a})`
  }

  throw new TypeError(`withAlpha: unparseable color "${color}"`)
}
