import {
  StyleSheet,
  Switch as RNSwitch,
  SwitchProps as RNSwitchProps,
  TextStyle,
} from "react-native"

import { Text } from "@/components/ui/text"
import { View } from "@/components/ui/view"
import { useColor } from "@/hooks/useColor"
import { CONTROL_FONT_SIZE } from "@/theme/globals"

interface SwitchProps extends RNSwitchProps {
  label?: string
  error?: string
  labelStyle?: TextStyle
}

export function Switch({ label, error, labelStyle, ...props }: SwitchProps) {
  const mutedColor = useColor("muted")
  const primary = useColor("primary")
  const primaryForeground = useColor("primaryForeground")
  const danger = useColor("destructive")

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {label && (
          <Text
            variant="caption"
            numberOfLines={2}
            ellipsizeMode="tail"
            style={[styles.label, { color: error ? danger : primary }, labelStyle]}
            pointerEvents="none"
          >
            {label}
          </Text>
        )}

        {/*
          ON is the PRIMARY accent, not `success`: a switch reports a setting's state, it does
          not report an outcome. `success` here made every enabled toggle read as a positive
          result and diverged from every other control's accent. The thumb follows the track's
          foreground so the pairing keeps its contrast.
        */}
        <RNSwitch
          trackColor={{ false: mutedColor, true: primary }}
          thumbColor={props.value ? primaryForeground : mutedColor}
          {...props}
        />
      </View>

      {error && (
        <Text
          variant="caption"
          numberOfLines={2}
          ellipsizeMode="tail"
          style={[styles.errorText, { color: danger }]}
          pointerEvents="none"
        >
          {error}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: CONTROL_FONT_SIZE,
    marginTop: 4,
  },
  label: {
    flex: 1,
    marginRight: 12,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 32,
  },
})
