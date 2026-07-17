/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme } from "@/hooks/useColorScheme"
import { Colors } from "@/theme/colors"

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
) {
  // RN 0.86 ColorSchemeName includes "unspecified" — normalize to light/dark
  const scheme = useColorScheme()
  const theme = scheme === "dark" ? "dark" : "light"
  const colorFromProps = props[theme]

  if (colorFromProps) {
    return colorFromProps
  } else {
    return Colors[theme][colorName]
  }
}
