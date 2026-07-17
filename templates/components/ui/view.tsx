import { forwardRef } from "react"
import { StyleSheet, View as RNView, type ViewProps } from "react-native"

import { TRANSPARENT } from "@/theme/globals"

export const View = forwardRef<RNView, ViewProps>(({ style, ...otherProps }, ref) => {
  return <RNView ref={ref} style={[styles.base, style]} {...otherProps} />
})

View.displayName = "View"

const styles = StyleSheet.create({
  base: {
    backgroundColor: TRANSPARENT,
  },
})
