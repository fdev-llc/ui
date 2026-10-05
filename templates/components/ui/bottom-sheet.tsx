import { useCallback, useContext, useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
  ViewStyle,
} from "react-native"
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler"
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import { SafeAreaInsetsContext } from "react-native-safe-area-context"

import { GlassSurface } from "@/components/ui/glass"
import { Text } from "@/components/ui/text"
import { View } from "@/components/ui/view"
import { useColor } from "@/hooks/useColor"
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight" // Make sure this path is correct
import { CORNERS, OVERLAY, RADIUS } from "@/theme/globals"

const DEFAULT_SNAP_POINTS = [0.3, 0.6, 0.9]

type BottomSheetContentProps = {
  children: ReactNode
  title?: string
  accessibilityHint?: string
  style?: ViewStyle
  rBottomSheetStyle: any
  rContentStyle: any
  mutedColor: string
  bottomInset: number
  onHandlePress?: () => void
}

// Component for the bottom sheet content
// It now includes a ScrollView by default for better form handling.
const BottomSheetContent = ({
  children,
  title,
  accessibilityHint,
  style,
  rBottomSheetStyle,
  rContentStyle,
  mutedColor,
  bottomInset,
  onHandlePress,
}: BottomSheetContentProps) => {
  const { height: screenHeight } = useWindowDimensions()

  return (
    <Animated.View
      // The sheet is a modal surface: `accessibilityViewIsModal` keeps assistive tech from
      // wandering into the content the backdrop visually blocks, and the role names what the
      // trap actually is. Deliberately NOT `accessible` — that would collapse the title,
      // body and every control inside into a single unreachable a11y element.
      role="dialog"
      accessibilityViewIsModal
      accessibilityLabel={title}
      // The title names the sheet but rarely says what it is FOR. The kit stays
      // i18n-agnostic, so the caller owns this copy — same contract as `Input`'s hint.
      accessibilityHint={accessibilityHint}
      style={[styles.sheet, { height: screenHeight, top: screenHeight }, rBottomSheetStyle, style]}
    >
      <GlassSurface tier="strong" style={StyleSheet.absoluteFill} />

      {/* Keep the scrolling viewport inside the visible extent, including its chrome. */}
      <Animated.View style={[styles.content, rContentStyle]}>
        {/* Handle */}
        <TouchableWithoutFeedback accessibilityRole="button" onPress={onHandlePress}>
          <View style={styles.handleArea}>
            <View style={[styles.handleBar, { backgroundColor: mutedColor }]} />
          </View>
        </TouchableWithoutFeedback>

        {/* Title */}
        {title && (
          <View style={styles.titleArea}>
            <Text variant="title" style={styles.titleText}>
              {title}
            </Text>
          </View>
        )}

        {/* Content now wrapped in a ScrollView */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(styles.scrollContent.paddingBottom, bottomInset) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </Animated.View>
    </Animated.View>
  )
}

type BottomSheetProps = {
  isVisible: boolean
  onClose: () => void
  children: ReactNode
  snapPoints?: number[]
  enableBackdropDismiss?: boolean
  title?: string
  /** Says what the sheet is FOR, beyond what `title` names it. Caller-owned copy. */
  accessibilityHint?: string
  style?: ViewStyle
  disablePanGesture?: boolean
}

export function BottomSheet({
  isVisible,
  onClose,
  children,
  snapPoints = DEFAULT_SNAP_POINTS,
  enableBackdropDismiss = true,
  title,
  accessibilityHint,
  style,
  disablePanGesture = false,
}: BottomSheetProps) {
  const mutedColor = useColor("muted")
  const { height: screenHeight } = useWindowDimensions()
  const maxTranslateY = -screenHeight + 50
  const { keyboardHeight, isKeyboardVisible } = useKeyboardHeight()
  const insets = useContext(SafeAreaInsetsContext)
  const bottomInset = isKeyboardVisible ? 0 : (insets?.bottom ?? 0)

  const translateY = useSharedValue(0)
  const context = useSharedValue({ y: 0 })
  const opacity = useSharedValue(0)
  const currentSnapIndex = useSharedValue(0)
  // Shared value to hold keyboard height for use in worklets
  const keyboardHeightSV = useSharedValue(0)

  const snapPointsHeights = snapPoints.map((point) => -screenHeight * point)
  // Callers can supply fresh inline arrays; only changed values should interrupt a pan.
  const snapPointsKey = snapPoints.join(",")
  const defaultHeight = snapPointsHeights[0]

  const [modalVisible, setModalVisible] = useState(false)
  const wasVisible = useRef(false)

  // Effect to handle opening and closing the bottom sheet
  useEffect(() => {
    if (isVisible) {
      if (!wasVisible.current) {
        setModalVisible(true)
        translateY.value = withSpring(defaultHeight, {
          damping: 50,
          stiffness: 400,
        })
        opacity.value = withTiming(1, { duration: 300 })
        currentSnapIndex.value = 0
      }
    } else {
      translateY.value = withSpring(0, { damping: 50, stiffness: 400 })
      opacity.value = withTiming(0, { duration: 300 }, (finished) => {
        if (finished) {
          runOnJS(setModalVisible)(false)
        }
      })
    }
    wasVisible.current = isVisible
  }, [isVisible, defaultHeight])

  // Function to animate the sheet to a specific destination
  const scrollTo = (destination: number) => {
    "worklet"
    translateY.value = withSpring(destination, { damping: 50, stiffness: 400 })
  }

  // --- START: NEW KEYBOARD HANDLING LOGIC ---
  useEffect(() => {
    // Update the shared value whenever keyboardHeight changes
    keyboardHeightSV.value = isKeyboardVisible ? keyboardHeight : 0

    // Only adjust position if the sheet is currently visible
    if (isVisible) {
      // A removed snap returns to the first remaining snap before reading its height.
      if (currentSnapIndex.value >= snapPointsHeights.length) {
        currentSnapIndex.value = 0
      }
      const currentSnapHeight = snapPointsHeights[currentSnapIndex.value]
      let destination: number

      if (isKeyboardVisible) {
        // Keyboard is open, move sheet up by keyboard height
        destination = currentSnapHeight - keyboardHeight
      } else {
        // Keyboard is closed, return to original snap point
        destination = currentSnapHeight
      }
      scrollTo(destination)
    }
  }, [keyboardHeight, isKeyboardVisible, isVisible, screenHeight, snapPointsKey])
  // --- END: NEW KEYBOARD HANDLING LOGIC ---

  const findClosestSnapPoint = (currentY: number) => {
    "worklet"
    // Adjust the currentY by the keyboard height to find the original snap point
    const adjustedY = currentY + keyboardHeightSV.value

    let closest = snapPointsHeights[0]
    let minDistance = Math.abs(adjustedY - closest)
    let closestIndex = 0

    for (let i = 0; i < snapPointsHeights.length; i++) {
      const snapPoint = snapPointsHeights[i]
      const distance = Math.abs(adjustedY - snapPoint)
      if (distance < minDistance) {
        minDistance = distance
        closest = snapPoint
        closestIndex = i
      }
    }
    currentSnapIndex.value = closestIndex
    return closest
  }

  const handlePress = () => {
    const nextIndex = (currentSnapIndex.value + 1) % snapPointsHeights.length
    currentSnapIndex.value = nextIndex
    const destination = snapPointsHeights[nextIndex] - keyboardHeightSV.value
    scrollTo(destination)
  }

  const animateClose = () => {
    "worklet"
    translateY.value = withSpring(0, { damping: 50, stiffness: 400 })
    opacity.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished) {
        runOnJS(onClose)()
      }
    })
  }

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value }
    })
    .onUpdate((event) => {
      const newY = context.value.y + event.translationY
      if (newY <= 0 && newY >= maxTranslateY) {
        translateY.value = newY
      }
    })
    .onEnd((event) => {
      const currentY = translateY.value
      const velocity = event.velocityY

      if (velocity > 500 && currentY > -screenHeight * 0.2) {
        animateClose()
        return
      }

      // Find the closest original snap point
      const closestSnapPoint = findClosestSnapPoint(currentY)
      // Calculate the final destination, accounting for the keyboard height
      const finalDestination = closestSnapPoint - keyboardHeightSV.value
      scrollTo(finalDestination)
    })

  const rBottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    }
  })

  // Container height - animated top - keyboard overlap (Paseo's visible-content
  // geometry). Flex layout deducts the actual handle/title sizes from the scroller.
  const rContentStyle = useAnimatedStyle(() => ({
    height: Math.max(0, -translateY.value - keyboardHeightSV.value),
    // A tall snap shifted above the window by the keyboard still needs its
    // handle/title and the start of its scroller inside the visible region.
    paddingTop: Math.max(0, -screenHeight - translateY.value),
  }))

  const rBackdropStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    }
  })

  const handleBackdropPress = () => {
    if (enableBackdropDismiss) {
      animateClose()
    }
  }

  return (
    <Modal visible={modalVisible} transparent statusBarTranslucent animationType="none">
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[styles.backdrop, rBackdropStyle]}>
          <TouchableWithoutFeedback accessibilityRole="button" onPress={handleBackdropPress}>
            <Animated.View style={styles.backdropTouchableArea} />
          </TouchableWithoutFeedback>

          {disablePanGesture ? (
            <BottomSheetContent
              title={title}
              accessibilityHint={accessibilityHint}
              style={style}
              rBottomSheetStyle={rBottomSheetStyle}
              rContentStyle={rContentStyle}
              mutedColor={mutedColor}
              bottomInset={bottomInset}
              onHandlePress={() => runOnJS(handlePress)()}
            >
              {children}
            </BottomSheetContent>
          ) : (
            <GestureDetector gesture={gesture}>
              <BottomSheetContent
                title={title}
                accessibilityHint={accessibilityHint}
                style={style}
                rBottomSheetStyle={rBottomSheetStyle}
                rContentStyle={rContentStyle}
                mutedColor={mutedColor}
                bottomInset={bottomInset}
                onHandlePress={() => runOnJS(handlePress)()}
              >
                {children}
              </BottomSheetContent>
            </GestureDetector>
          )}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  )
}

// Hook for managing bottom sheet state
export function useBottomSheet() {
  const [isVisible, setIsVisible] = useState(false)

  const open = useCallback(() => {
    setIsVisible(true)
  }, [])

  const close = useCallback(() => {
    setIsVisible(false)
  }, [])

  const toggle = useCallback(() => {
    setIsVisible((prev) => !prev)
  }, [])

  return {
    isVisible,
    open,
    close,
    toggle,
  }
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: OVERLAY.strong,
    flex: 1,
  },
  backdropTouchableArea: {
    flex: 1,
  },
  content: {
    maxHeight: "100%",
    overflow: "hidden",
  },
  handleArea: {
    alignItems: "center",
    paddingVertical: 12,
    width: "100%",
  },
  handleBar: {
    borderRadius: CORNERS,
    height: 6,
    width: 64,
  },
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sheet: {
    borderTopLeftRadius: RADIUS["4xl"],
    borderTopRightRadius: RADIUS["4xl"],
    overflow: "hidden",
    position: "absolute",
    width: "100%",
  },
  titleArea: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingBottom: 8,
  },
  titleText: {
    textAlign: "center",
  },
})
