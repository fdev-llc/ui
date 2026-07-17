import { ViewStyle } from "react-native"

import { Text } from "@/components/ui/text"
import { View } from "@/components/ui/view"
import { useColor } from "@/hooks/useColor"
import { RADIUS } from "@/theme/globals"

type Props = {
  title?: string
  description?: string
  children: React.ReactNode
  style?: ViewStyle
}

export const ChartContainer = ({ title, description, children, style }: Props) => {
  const cardColor = useColor("card")

  return (
    <View
      style={[
        {
          backgroundColor: cardColor,
          borderRadius: RADIUS["4xl"],
          padding: 16,
          width: "100%", // Full container width
        },
        style,
      ]}
    >
      {title && (
        <Text variant="subtitle" style={{ marginBottom: 4 }}>
          {title}
        </Text>
      )}
      {description && (
        <Text variant="caption" style={{ marginBottom: 16 }}>
          {description}
        </Text>
      )}
      {children}
    </View>
  )
}
