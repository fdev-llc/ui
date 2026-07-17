import { Pressable, View, ViewStyle } from "react-native"
import { Monitor, Moon, Sun } from "lucide-react-native"

import { Icon } from "@/components/ui/icon"
import { Text } from "@/components/ui/text"
import { useColor } from "@/hooks/useColor"
import { CONTROL_FONT_SIZE, RADIUS } from "@/theme/globals"

export type ThemePreference = "light" | "dark" | "system"

export interface ModeToggleProps {
  value: ThemePreference
  onValueChange: (value: ThemePreference) => void
  /** Required: the kit stays i18n-agnostic, so the caller owns the copy. */
  labels: Record<ThemePreference, string>
  disabled?: boolean
  style?: ViewStyle
}

const OPTIONS: { value: ThemePreference; icon: typeof Sun }[] = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
]

/**
 * Controlled three-choice theme picker. It owns no mode state and never calls
 * Appearance or persists anything: "system" is a real third choice that only the
 * app can resolve, and a component that both guesses the current mode and writes
 * the global appearance fights whatever store the app already has.
 */
export function ModeToggle({
  value,
  onValueChange,
  labels,
  disabled = false,
  style,
}: ModeToggleProps) {
  const borderColor = useColor("border")
  const mutedColor = useColor("muted")
  const primaryColor = useColor("primary")
  const primaryForegroundColor = useColor("primaryForeground")
  const mutedForegroundColor = useColor("mutedForeground")

  return (
    <View
      accessibilityRole="radiogroup"
      style={[
        {
          flexDirection: "row",
          gap: 4,
          padding: 4,
          borderRadius: RADIUS["lg"],
          borderWidth: 1,
          borderColor,
          backgroundColor: mutedColor,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {OPTIONS.map((option) => {
        const selected = option.value === value
        const contentColor = selected ? primaryForegroundColor : mutedForegroundColor

        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, disabled }}
            accessibilityLabel={labels[option.value]}
            disabled={disabled}
            onPress={() => onValueChange(option.value)}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: RADIUS["md"],
              backgroundColor: selected ? primaryColor : "transparent",
            }}
          >
            <Icon name={option.icon} size={16} color={contentColor} />
            <Text style={{ fontSize: CONTROL_FONT_SIZE, fontWeight: "500", color: contentColor }}>
              {labels[option.value]}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
