import { useEffect, useState } from "react"
import {
  AccessibilityInfo,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from "react-native"
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
 * Whether iOS "Reduce Transparency" is on — `null` until the first read resolves.
 *
 * FAIL-CLOSED: the caller treats `null` as "reduce it", so the very first frame is the
 * opaque card. The read is async, so the alternative is to blur first and snap to opaque a
 * tick later — which shows the exact effect the setting exists to prevent to the exact user
 * who asked not to see it. Rendering opaque and then relaxing to glass is the safe order.
 */
function useReduceTransparency(): boolean | null {
  const [reduceTransparency, setReduceTransparency] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true

    // The listener alone would never fire for someone who had the setting ON before mount.
    AccessibilityInfo.isReduceTransparencyEnabled()
      .then((enabled) => {
        if (active) setReduceTransparency(enabled)
      })
      // RN rejects this when the iOS accessibility manager is unavailable. Swallowing it
      // leaves the state `null`, which is the opaque card — if we cannot find out whether
      // the user asked to reduce transparency, we do not get to assume they did not.
      .catch(() => {})

    const subscription = AccessibilityInfo.addEventListener(
      "reduceTransparencyChanged",
      setReduceTransparency,
    )

    return () => {
      // `active` guards the in-flight promise: without it a resolve after unmount sets
      // state on a dead component.
      active = false
      subscription.remove()
    }
  }, [])

  return reduceTransparency
}

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
 *
 * iOS "Reduce Transparency" collapses to that same opaque card. The setting is a
 * request from users for whom blurred-content-behind-content is unreadable or
 * nauseating, and it is not advisory — honouring it is the whole point of the
 * fallback already existing.
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
  const reduceTransparency = useReduceTransparency()

  // Blur is the exception, not the default: it needs iOS AND a resolved, negative
  // reduce-transparency read. Everything else — Android, web, the pre-read frame, an
  // opted-out user — gets the opaque card.
  if (Platform.OS !== "ios" || reduceTransparency !== false) {
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
