import { memo, useEffect, useMemo } from "react"
import { ActivityIndicator, StyleSheet, View, ViewStyle } from "react-native"
import { Loader2 } from "lucide-react-native"
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated"

import { Text } from "@/components/ui/text"
import { useColor } from "@/hooks/useColor"
import { withAlpha } from "@/theme/colorUtils"
import { CORNERS, FONT_SIZE, RADIUS, TRANSPARENT } from "@/theme/globals"

// Types
type SpinnerSize = "default" | "sm" | "lg" | "icon"
export type SpinnerVariant = "default" | "circle" | "dots" | "pulse" | "bars"

interface SpinnerProps {
  size?: SpinnerSize
  variant?: SpinnerVariant
  label?: string
  showLabel?: boolean
  style?: ViewStyle
  color?: string
  thickness?: number // Note: thickness is not used in the original component logic
  speed?: "slow" | "normal" | "fast"
}

interface LoadingOverlayProps extends SpinnerProps {
  visible: boolean
  backdrop?: boolean
  backdropColor?: string
  backdropOpacity?: number
  onRequestClose?: () => void
}

interface SpinnerConfig {
  size: number
  iconSize: number
  fontSize: number
  gap: number
  thickness: number
}

// Configuration
const sizeConfig: Record<SpinnerSize, SpinnerConfig> = {
  sm: { size: 16, iconSize: 16, fontSize: 12, gap: 6, thickness: 2 },
  default: {
    size: 24,
    iconSize: 24,
    fontSize: FONT_SIZE,
    gap: 8,
    thickness: 2,
  },
  lg: { size: 32, iconSize: 32, fontSize: 16, gap: 10, thickness: 3 },
  icon: { size: 24, iconSize: 24, fontSize: FONT_SIZE, gap: 8, thickness: 2 },
}

const speedConfig = {
  slow: 1500,
  normal: 1000,
  fast: 500,
}

// --- Helper Animated Components for Dots and Bars ---

interface AnimatedShapeProps {
  anim: SharedValue<number>
  color: string
  size: number
  style: ViewStyle
}

const AnimatedDot = memo(({ anim, color, size, style }: AnimatedShapeProps) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: anim.value,
  }))
  return (
    <Animated.View
      style={[style, { width: size, height: size, backgroundColor: color }, animatedStyle]}
    />
  )
})

const AnimatedBar = memo(({ anim, color, size, style }: AnimatedShapeProps) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: anim.value,
  }))
  return (
    <Animated.View
      style={[style, { width: size / 6, height: size, backgroundColor: color }, animatedStyle]}
    />
  )
})

AnimatedDot.displayName = "AnimatedDot"
AnimatedBar.displayName = "AnimatedBar"

// Main Spinner Component
export function Spinner({
  size = "default",
  variant = "default",
  label,
  showLabel = false,
  style,
  color,
  speed = "normal",
}: SpinnerProps) {
  // Reanimated shared values
  const rotate = useSharedValue(0)
  const pulse = useSharedValue(1)

  // --- FIX: Call hooks at the top level ---
  // 1. Call useSharedValue at the top level for each dot/bar
  const dotAnim1 = useSharedValue(0.3)
  const dotAnim2 = useSharedValue(0.3)
  const dotAnim3 = useSharedValue(0.3)

  const barAnim1 = useSharedValue(0.3)
  const barAnim2 = useSharedValue(0.3)
  const barAnim3 = useSharedValue(0.3)
  const barAnim4 = useSharedValue(0.3)

  // 2. Use useMemo to create a stable array reference from the values
  const dotsAnims = useMemo(() => [dotAnim1, dotAnim2, dotAnim3], [dotAnim1, dotAnim2, dotAnim3])
  const barsAnims = useMemo(
    () => [barAnim1, barAnim2, barAnim3, barAnim4],
    [barAnim1, barAnim2, barAnim3, barAnim4],
  )
  // --- END FIX ---

  // Theme colors
  const primaryColor = useColor("text")
  const textColor = useColor("text")

  const config = sizeConfig[size]
  const spinnerColor = color || primaryColor
  const animationDuration = speedConfig[speed]

  // Rotation animation
  useEffect(() => {
    if (variant === "circle") {
      rotate.value = withRepeat(
        withTiming(360, { duration: animationDuration, easing: Easing.linear }),
        -1,
      )
    } else {
      rotate.value = 0 // Reset
    }
  }, [rotate, variant, animationDuration])

  // Pulse animation
  useEffect(() => {
    if (variant === "pulse") {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: animationDuration / 2 }),
          withTiming(1, { duration: animationDuration / 2 }),
        ),
        -1,
        true,
      )
    } else {
      pulse.value = 1 // Reset
    }
  }, [pulse, variant, animationDuration])

  // Dots animation
  useEffect(() => {
    if (variant === "dots") {
      dotsAnims.forEach((anim, index) => {
        anim.value = withRepeat(
          withSequence(
            withDelay(
              index * (animationDuration / 6),
              withTiming(1, { duration: animationDuration / 3 }),
            ),
            withTiming(0.3, { duration: animationDuration / 3 }),
          ),
          -1,
        )
      })
    } else {
      dotsAnims.forEach((anim) => (anim.value = 0.3)) // Reset
    }
  }, [dotsAnims, variant, animationDuration])

  // Bars animation
  useEffect(() => {
    if (variant === "bars") {
      barsAnims.forEach((anim, index) => {
        anim.value = withRepeat(
          withSequence(
            withDelay(
              index * (animationDuration / 8),
              withTiming(1, { duration: animationDuration / 4 }),
            ),
            withTiming(0.3, { duration: animationDuration / 4 }),
          ),
          -1,
        )
      })
    } else {
      barsAnims.forEach((anim) => (anim.value = 0.3)) // Reset
    }
  }, [barsAnims, variant, animationDuration])

  // Animated styles
  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }))

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }))

  const renderSpinner = () => {
    switch (variant) {
      case "default":
        return <ActivityIndicator size={config.size} color={spinnerColor} style={styles.spinner} />

      case "circle":
        return (
          <Animated.View
            style={[
              styles.customSpinner,
              { width: config.size, height: config.size },
              animatedCircleStyle,
            ]}
          >
            <Loader2 size={config.iconSize} color={spinnerColor} />
          </Animated.View>
        )

      case "pulse":
        return (
          <Animated.View
            style={[
              styles.pulseSpinner,
              {
                width: config.size,
                height: config.size,
                backgroundColor: spinnerColor,
              },
              animatedPulseStyle,
            ]}
          />
        )

      case "dots":
        return (
          <View style={[styles.dotsContainer, { gap: config.size / 4 }]}>
            {dotsAnims.map((anim, index) => (
              <AnimatedDot
                key={index}
                anim={anim}
                color={spinnerColor}
                size={config.size / 3}
                style={styles.dot}
              />
            ))}
          </View>
        )

      case "bars":
        return (
          <View style={[styles.barsContainer, { gap: config.size / 6 }]}>
            {barsAnims.map((anim, index) => (
              <AnimatedBar
                key={index}
                anim={anim}
                color={spinnerColor}
                size={config.size}
                style={styles.bar}
              />
            ))}
          </View>
        )

      default:
        return null
    }
  }

  const containerStyle: ViewStyle = {
    alignItems: "center",
    justifyContent: "center",
    gap: config.gap,
  }

  /**
   * A spinner is a busy indicator, so it must announce itself as one rather than sit in the
   * tree as an unlabelled decorative view. Grouping is deliberate: the spinner and its label
   * are one status, and neither is focusable on its own, so assistive tech reads "<label>,
   * busy" as a single announcement instead of stopping on a mute view.
   */
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      style={[containerStyle, style]}
    >
      {renderSpinner()}
      {(showLabel || label) && (
        <Text
          style={[
            styles.label,
            {
              color: textColor,
              fontSize: config.fontSize,
            },
          ]}
        >
          {label || "Loading..."}
        </Text>
      )}
    </View>
  )
}

// Loading Overlay Component
export function LoadingOverlay({
  visible,
  backdrop = true,
  backdropColor,
  backdropOpacity = 0.5,
  ...spinnerProps
}: LoadingOverlayProps) {
  const opacity = useSharedValue(0)
  const backgroundColor = useColor("background")
  const cardColor = useColor("card")

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, {
      duration: 200,
    })
  }, [visible, opacity])

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    // Conditionally render to avoid interaction issues
    display: opacity.value === 0 ? "none" : "flex",
  }))

  const defaultBackdropColor = backdropColor || withAlpha(backgroundColor, backdropOpacity)

  return (
    <Animated.View
      style={[
        styles.overlay,
        { backgroundColor: backdrop ? defaultBackdropColor : TRANSPARENT },
        animatedOverlayStyle,
      ]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <View style={[styles.overlayContent, { backgroundColor: cardColor }]}>
        <Spinner {...spinnerProps} />
      </View>
    </Animated.View>
  )
}

// Inline Loader Component (for buttons, etc.)
export function InlineLoader({
  size = "sm",
  variant = "default",
  color,
}: Omit<SpinnerProps, "label" | "showLabel">) {
  return <Spinner size={size} variant={variant} color={color} style={styles.inlineLoader} />
}

// Button Spinner Component - optimized for button usage
export function ButtonSpinner({
  size = "sm",
  variant = "default",
  color,
}: Omit<SpinnerProps, "label" | "showLabel">) {
  const primaryForegroundColor = useColor("primaryForeground")

  return (
    <Spinner
      size={size}
      variant={variant}
      color={color || primaryForegroundColor}
      style={styles.buttonSpinner}
    />
  )
}

const styles = StyleSheet.create({
  bar: {
    borderRadius: CORNERS,
  },
  barsContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonSpinner: {
    minHeight: 0,
    minWidth: 0,
  },
  customSpinner: {
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    borderRadius: 999,
  },
  dotsContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  inlineLoader: {
    minHeight: 0,
    minWidth: 0,
  },
  label: {
    fontWeight: "500",
    textAlign: "center",
  },
  overlay: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 9999,
  },
  overlayContent: {
    borderRadius: RADIUS["4xl"],
    padding: 60,
  },
  pulseSpinner: {
    borderRadius: 999,
  },
  spinner: {
    alignSelf: "center",
  },
})
