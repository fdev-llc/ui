import { Platform, StyleProp, StyleSheet, View, ViewProps, ViewStyle } from "react-native"
import { BlurView } from "expo-blur"

import { useColor } from "@/hooks/useColor"
import { useColorScheme } from "@/hooks/useColorScheme"
import { withAlpha } from "@/theme/colorUtils"

/** `soft` for resting surfaces (cards); `strong` for surfaces that float over content. */
export type GlassTier = "soft" | "strong"

export interface GlassSurfaceProps extends ViewProps {
  tier?: GlassTier
  /** Blur intensity 1-100. Defaults to the tier's intensity. */
  intensity?: number
  style?: StyleProp<ViewStyle>
}

const TIER_INTENSITY: Record<GlassTier, number> = { soft: 24, strong: 48 }

/**
 * Translucent surface: a real blur on iOS, an opaque card everywhere else.
 *
 * Android is opaque BY CONTRACT. expo-blur's Android blur needs `blurMethod`
 * ('dimezisBlurView'), which the library documents as degrading performance on
 * SDK 30 and below; the default 'none' renders a flat semi-transparent view —
 * translucency with no blur behind it, which reads as a washed-out surface
 * rather than glass. An opaque card is the honest fallback, so a caller never
 * has to reason about which of three renderings it got.
 *
 * The overlay is precomputed rather than left to the blur tint: the tint alone
 * does not carry the theme's card colour, so a themed surface would drift
 * toward system grey.
 */
export function GlassSurface({
  tier = "soft",
  intensity,
  style,
  children,
  ...rest
}: GlassSurfaceProps) {
  const cardColor = useColor("card")
  const isDark = useColorScheme() === "dark"

  if (Platform.OS !== "ios") {
    return (
      <View style={[{ backgroundColor: cardColor }, style]} {...rest}>
        {children}
      </View>
    )
  }

  // Dark surfaces need a touch more transparency to read as glass at the same intensity.
  const overlayColor = withAlpha(cardColor, isDark ? 0.72 : 0.78)

  return (
    <BlurView
      intensity={intensity ?? TIER_INTENSITY[tier]}
      tint={isDark ? "dark" : "light"}
      style={[styles.blur, style]}
      {...rest}
    >
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]}
        pointerEvents="none"
      />
      {children}
    </BlurView>
  )
}

const styles = StyleSheet.create({
  blur: {
    overflow: "hidden",
  },
})
