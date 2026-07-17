import { useCallback, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { Modal, StyleSheet, TouchableWithoutFeedback, View, ViewStyle } from "react-native"
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import { Button } from "@/components/ui/button"
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { GlassSurface } from "@/components/ui/glass"
import { OVERLAY, RADIUS } from "@/theme/globals"

export type AlertDialogProps = {
  isVisible: boolean
  onClose: () => void
  title?: string
  description?: string
  children?: ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
  dismissible?: boolean
  showCancelButton?: boolean
  style?: ViewStyle
}

// A simple card-like dialog overlay with fade-in animation similar to BottomSheet's backdrop
export function AlertDialog({
  isVisible,
  onClose,
  title,
  description,
  children,
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  dismissible = true,
  showCancelButton = true,
  style,
}: AlertDialogProps) {
  const [modalVisible, setModalVisible] = useState(isVisible)
  const backdropOpacity = useSharedValue(0)
  const cardOpacity = useSharedValue(0)

  /**
   * The Modal has to outlive `isVisible` so the close fade can finish before it unmounts, which
   * is why its mount is state and not the prop. Opening is adopted DURING RENDER — React's
   * sanctioned "adjust state when a prop changes" path — rather than from the effect body:
   * doing it there mounts the modal hidden and only flips it on a second pass, so the fade-in
   * loses its first frames. Closing still waits on the fade's completion callback.
   */
  if (isVisible && !modalVisible) {
    setModalVisible(true)
  }

  const animateClose = () => {
    "worklet"
    backdropOpacity.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished) {
        runOnJS(onClose)()
      }
    })
    cardOpacity.value = withTiming(0, { duration: 200 })
  }

  useEffect(() => {
    if (isVisible) {
      backdropOpacity.value = withTiming(1, { duration: 250 })
      cardOpacity.value = withTiming(1, { duration: 200 })
    } else {
      backdropOpacity.value = withTiming(0, { duration: 250 }, (finished) => {
        if (finished) {
          runOnJS(setModalVisible)(false)
        }
      })
      cardOpacity.value = withTiming(0, { duration: 200 })
    }
  }, [isVisible, backdropOpacity, cardOpacity])

  const rBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }))

  const rCardFadeStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
  }))

  const handleBackdropPress = () => {
    if (dismissible) {
      animateClose()
      if (onCancel) onCancel()
    }
  }

  const handleCancel = () => {
    if (onCancel) onCancel()
    animateClose()
  }

  const handleConfirm = () => {
    if (onConfirm) onConfirm()
    animateClose()
  }

  return (
    <Modal visible={modalVisible} transparent statusBarTranslucent animationType="none">
      <Animated.View style={[styles.backdrop, rBackdropStyle]}>
        <TouchableWithoutFeedback accessibilityRole="button" onPress={handleBackdropPress}>
          <Animated.View style={styles.backdropTouchableArea} />
        </TouchableWithoutFeedback>

        {/* Non-animated outer wrapper: handles rounded corners and clipping */}
        <GlassSurface
          // `accessibilityViewIsModal` keeps assistive tech from wandering into the content
          // the backdrop visually blocks; the role names what the trap actually is.
          role="alertdialog"
          accessibilityViewIsModal
          accessibilityLabel={title}
          accessibilityHint={description}
          tier="strong"
          style={[styles.roundedWrapper, style]}
        >
          {/* Only fade the inner content */}
          <Animated.View style={[styles.innerContent, rCardFadeStyle]}>
            <View style={styles.body}>
              {(title || description) && (
                <CardHeader>
                  {title ? <CardTitle>{title}</CardTitle> : null}
                  {description ? <CardDescription>{description}</CardDescription> : null}
                </CardHeader>
              )}
              {children ? <CardContent>{children}</CardContent> : null}
              <CardFooter>
                {showCancelButton && (
                  <Button variant="outline" onPress={handleCancel}>
                    {cancelText}
                  </Button>
                )}
                <Button style={styles.confirmButton} onPress={handleConfirm}>
                  {confirmText}
                </Button>
              </CardFooter>
            </View>
          </Animated.View>
        </GlassSurface>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: OVERLAY.strong,
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  backdropTouchableArea: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  body: {
    padding: 18,
  },
  confirmButton: {
    flex: 1,
  },
  // Inner content can render freely (only opacity is animated)
  innerContent: {
    width: "100%",
  },
  // Rounded corners and clipping consolidated here (non-animated)
  roundedWrapper: {
    borderRadius: RADIUS["xl"],
    overflow: "hidden",
    width: "100%",
  },
})

export function useAlertDialog() {
  const [isVisible, setIsVisible] = useState(false)
  const open = useCallback(() => setIsVisible(true), [])
  const close = useCallback(() => setIsVisible(false), [])
  const toggle = useCallback(() => setIsVisible((v) => !v), [])
  return { isVisible, open, close, toggle }
}
