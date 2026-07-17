import { useContext } from "react"
import { Platform } from "react-native"
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs"

/**
 * Bottom tab bar height to compensate for on iOS (where the bar is translucent
 * and content scrolls under it). Reads the context directly instead of
 * `useBottomTabBarHeight` so it returns 0 (instead of throwing) on screens
 * that are not inside a bottom-tab navigator.
 */
export function useBottomTabOverflow() {
  const tabBarHeight = useContext(BottomTabBarHeightContext)
  return Platform.OS === "ios" ? (tabBarHeight ?? 0) : 0
}
