import { StyleSheet, TextStyle, ViewStyle } from "react-native"

import { GlassSurface } from "@/components/ui/glass"
import { Text } from "@/components/ui/text"
import { View } from "@/components/ui/view"
import { useColor } from "@/hooks/useColor"
import { RADIUS } from "@/theme/globals"

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
}

export function Card({ children, style }: CardProps) {
  const foregroundColor = useColor("foreground")

  return (
    <View style={[styles.card, { shadowColor: foregroundColor }, style]}>
      <GlassSurface tier="soft" style={styles.surface}>
        {children}
      </GlassSurface>
    </View>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  style?: ViewStyle
}

export function CardHeader({ children, style }: CardHeaderProps) {
  return <View style={[styles.header, style]}>{children}</View>
}

interface CardTitleProps {
  children: React.ReactNode
  style?: TextStyle
}

export function CardTitle({ children, style }: CardTitleProps) {
  return (
    <Text variant="title" style={[styles.title, style]}>
      {children}
    </Text>
  )
}

interface CardDescriptionProps {
  children: React.ReactNode
  style?: TextStyle
}

export function CardDescription({ children, style }: CardDescriptionProps) {
  return (
    <Text variant="caption" style={style}>
      {children}
    </Text>
  )
}

interface CardContentProps {
  children: React.ReactNode
  style?: ViewStyle
}

export function CardContent({ children, style }: CardContentProps) {
  return <View style={style}>{children}</View>
}

interface CardFooterProps {
  children: React.ReactNode
  style?: ViewStyle
}

export function CardFooter({ children, style }: CardFooterProps) {
  return <View style={[styles.footer, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS["4xl"],
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    width: "100%",
  },
  footer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  header: {
    marginBottom: 8,
  },
  surface: {
    borderRadius: RADIUS["4xl"],
    padding: 18,
  },
  title: {
    marginBottom: 4,
  },
})
