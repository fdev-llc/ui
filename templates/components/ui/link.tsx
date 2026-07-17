import React from "react"
import { GestureResponderEvent, Linking, Platform, Pressable, PressableProps } from "react-native"
import { openBrowserAsync } from "expo-web-browser"
import { useNavigation } from "@react-navigation/native"

import { Text } from "@/components/ui/text"

// Adapted from the BNA UI expo-router Link: this app navigates with
// react-navigation, so internal hrefs are screen names instead of routes.
type Props = Omit<PressableProps, "onPress"> & {
  /** External URL (http, mailto, tel, ...) or a react-navigation screen name. */
  href: string
  browser?: "in-app" | "external"
  onPress?: (event: GestureResponderEvent) => void
  children: React.ReactNode
}

const isExternalUrl = (href: string): boolean =>
  /^(https?|mailto|tel|sms|whatsapp|ftp|file):/.test(href)

// URLs that should open in a native app (email, phone, ...) rather than a browser
const isNativeAppUrl = (href: string): boolean => /^(mailto|tel|sms|whatsapp):/.test(href)

export function Link({ href, children, browser = "in-app", onPress, ...rest }: Props) {
  const navigation = useNavigation()

  const handlePress = async (event: GestureResponderEvent) => {
    onPress?.(event)

    if (!isExternalUrl(href)) {
      // @ts-expect-error navigate is untyped here; screens type their own params
      navigation.navigate(href)
      return
    }

    if (Platform.OS === "web") {
      if (isNativeAppUrl(href)) {
        window.location.href = href
      } else {
        window.open(href, "_blank")
      }
      return
    }

    if (isNativeAppUrl(href) || browser === "external") {
      try {
        const canOpen = await Linking.canOpenURL(href)
        if (canOpen) {
          await Linking.openURL(href)
        } else {
          console.warn(`Cannot open URL: ${href}`)
        }
      } catch (error) {
        console.error("Error opening URL:", error)
      }
      return
    }

    try {
      await openBrowserAsync(href)
    } catch {
      // In-app browser unavailable (e.g. stripped-down device) — fall back
      await Linking.openURL(href)
    }
  }

  return (
    <Pressable onPress={handlePress} {...rest}>
      {typeof children === "string" ? <Text variant="link">{children}</Text> : children}
    </Pressable>
  )
}
