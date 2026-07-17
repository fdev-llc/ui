import { StyleProp, StyleSheet, TextStyle } from "react-native"

/**
 * Geist is the kit's brand font. Families are named by PostScript name (one family per
 * weight) because the static Geist TTFs expose non-RIBBI weights (Light/Medium/SemiBold/
 * ExtraBold) under separate iOS family names — `fontFamily: "Geist" + fontWeight` cannot
 * reach them. `fontFamilyForWeight`/`withGeistFont` remap weights to the right family on
 * every platform (Android registers each file by filename, matching the PostScript name).
 *
 * Loading the TTFs is the app's job, not the kit's: this module deliberately ships no
 * `require()` of font assets, because a path to a TTF the app does not have is a Metro
 * resolution error at build time. An app that never loads Geist degrades to the system
 * font instead of failing to bundle.
 */
const fonts = {
  geist: {
    light: "Geist-Light",
    normal: "Geist-Regular",
    medium: "Geist-Medium",
    semiBold: "Geist-SemiBold",
    bold: "Geist-Bold",
    extraBold: "Geist-ExtraBold",
  },
  geistMono: {
    normal: "GeistMono-Regular",
  },
}

export const typography = {
  fonts,
  /** The primary font. Used in most places. */
  primary: fonts.geist,
  /** Monospace font for code, timers and error backtraces. */
  code: fonts.geistMono,
}

/** Maps a React Native `fontWeight` to the matching Geist family name. */
export function fontFamilyForWeight(weight?: TextStyle["fontWeight"]): string {
  switch (String(weight ?? "400")) {
    case "100":
    case "200":
    case "300":
    case "ultralight":
    case "thin":
    case "light":
      return fonts.geist.light
    case "500":
    case "medium":
      return fonts.geist.medium
    case "600":
    case "semibold":
      return fonts.geist.semiBold
    case "700":
    case "bold":
    case "heavy":
      return fonts.geist.bold
    case "800":
    case "900":
    case "black":
      return fonts.geist.extraBold
    default:
      return fonts.geist.normal
  }
}

/**
 * Resolves a text style to use the brand font: flattens the style, swaps `fontWeight` for
 * the matching Geist family and strips the weight so the renderer never synthesizes a fake
 * bold on top of a real weight file. Styles that already declare an explicit `fontFamily`
 * are left untouched.
 */
export function withGeistFont(style?: StyleProp<TextStyle>): TextStyle {
  const flat = StyleSheet.flatten(style) ?? {}
  if (flat.fontFamily) return flat
  const { fontWeight, ...rest } = flat
  return { ...rest, fontFamily: fontFamilyForWeight(fontWeight) }
}
