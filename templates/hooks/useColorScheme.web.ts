import { useSyncExternalStore } from "react"
import { useColorScheme as useRNColorScheme } from "react-native"

const emptySubscribe = () => () => {}

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web.
 * useSyncExternalStore returns false on the server/first paint and true after hydration —
 * same behavior as the setState-in-effect pattern, but React Compiler safe.
 */
export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )

  const colorScheme = useRNColorScheme()

  if (hasHydrated) {
    return colorScheme
  }

  return "light"
}
