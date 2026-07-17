import { Children, forwardRef, isValidElement, useState } from "react"
import type { ComponentType, ReactElement, ReactNode } from "react"
import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"
import { LucideProps } from "lucide-react-native"

import { Icon } from "@/components/ui/icon"
import { Text } from "@/components/ui/text"
import { useColor } from "@/hooks/useColor"
import { withAlpha } from "@/theme/colorUtils"
import { CONTROL_FONT_SIZE, FONT_SIZE, HEIGHT, RADIUS, TRANSPARENT } from "@/theme/globals"
import { withGeistFont } from "@/theme/typography"

export interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string
  error?: string
  icon?: ComponentType<LucideProps>
  rightComponent?: ReactNode | (() => ReactNode)
  containerStyle?: ViewStyle
  inputStyle?: TextStyle
  labelStyle?: TextStyle
  errorStyle?: TextStyle
  variant?: "filled" | "outline"
  disabled?: boolean
  type?: "input" | "textarea"
  placeholder?: string
  rows?: number // Only used when type="textarea"
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      icon,
      rightComponent,
      containerStyle,
      inputStyle,
      labelStyle,
      errorStyle,
      variant = "filled",
      disabled = false,
      type = "input",
      rows = 4,
      onFocus,
      onBlur,
      placeholder,
      accessibilityHint,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false)

    // Theme colors
    const cardColor = useColor("card")
    const textColor = useColor("text")
    const muted = useColor("textMuted")
    const borderColor = useColor("border")
    const primary = useColor("primary")
    const ring = useColor("ring")
    const danger = useColor("destructive")

    const isTextarea = type === "textarea"

    /**
     * The visible label names the field, but it is a sibling Text — the TextInput itself would
     * otherwise reach assistive tech unnamed. The placeholder is only a fallback: it is a hint,
     * not a name, and it disappears the moment the field has a value.
     *
     * `accessibilityHint` is threaded explicitly rather than left to `...props` because the kit
     * stays i18n-agnostic: the caller owns the copy, exactly as `ModeToggle` takes its `hints`.
     */
    const accessibleName = label ?? placeholder

    /**
     * An invalid field must say WHY it is invalid, and on RN that has to be the hint.
     *
     * RN 0.86 exposes no invalid state to assistive tech on either platform:
     * `AccessibilityState` carries only disabled/selected/checked/busy/expanded, and there is
     * no `aria-invalid`. So the error cannot be a machine-readable flag a screen reader turns
     * into "invalid" — it has to reach the user as speech. The hint is the slot for exactly
     * that: a field's non-obvious condition, read out after the name. The error Text carries
     * `role="alert"` on top, so the message also announces the moment it appears.
     *
     * A caller-supplied hint still wins: the caller owns the copy, and its hint is the more
     * specific instruction. It is never silently replaced by the error string.
     */
    const accessibleHint = accessibilityHint ?? error

    // Calculate height based on type
    const getHeight = () => {
      if (isTextarea) {
        return rows * 20 + 32 // Approximate line height + padding
      }
      return HEIGHT
    }

    // Variant styles
    const getVariantStyle = (): ViewStyle => {
      const baseStyle: ViewStyle = {
        borderRadius: RADIUS["3xl"],
        flexDirection: isTextarea ? "column" : "row",
        alignItems: isTextarea ? "stretch" : "center",
        minHeight: getHeight(),
        paddingHorizontal: 16,
        paddingVertical: isTextarea ? 12 : 0,
      }

      switch (variant) {
        case "outline":
          return {
            ...baseStyle,
            borderWidth: 1,
            borderColor: error ? danger : isFocused ? ring : borderColor,
            backgroundColor: TRANSPARENT,
          }
        case "filled":
        default:
          return {
            ...baseStyle,
            borderWidth: 1,
            borderColor: error ? danger : cardColor,
            backgroundColor: disabled ? withAlpha(muted, 0.125) : cardColor,
          }
      }
    }

    const getInputStyle = (): TextStyle => ({
      flex: 1,
      fontSize: FONT_SIZE,
      lineHeight: isTextarea ? 20 : undefined,
      color: disabled ? muted : error ? danger : textColor,
      paddingVertical: 0, // Remove default padding
      textAlignVertical: isTextarea ? "top" : "center",
    })

    const handleFocus = (e: any) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: any) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    // Render right component - supports both direct components and functions
    const renderRightComponent = () => {
      if (!rightComponent) return null

      // If it's a function, call it. Otherwise, render directly
      return typeof rightComponent === "function" ? rightComponent() : rightComponent
    }

    const renderInputContent = () => (
      <View style={containerStyle}>
        {/* Input Container */}
        <Pressable
          accessibilityRole="button"
          style={[getVariantStyle(), disabled && styles.pressableDisabled]}
          onPress={() => {
            if (!disabled && ref && "current" in ref && ref.current) {
              ref.current.focus()
            }
          }}
          disabled={disabled}
        >
          {isTextarea ? (
            // Textarea Layout (Column)
            <>
              {/* Header section with icon, label, and right component */}
              {(icon || label || rightComponent) && (
                <View style={styles.headerRow}>
                  {/* Left section - Icon + Label */}
                  <View style={styles.headerLeft} pointerEvents="none">
                    {icon && <Icon name={icon} size={16} color={error ? danger : muted} />}
                    {label && (
                      <Text
                        variant="caption"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={[
                          {
                            fontSize: CONTROL_FONT_SIZE,
                            color: error ? danger : muted,
                          },
                          labelStyle,
                        ]}
                        pointerEvents="none"
                      >
                        {label}
                      </Text>
                    )}
                  </View>

                  {/* Right Component */}
                  {renderRightComponent()}
                </View>
              )}

              {/* TextInput section */}
              <TextInput
                ref={ref}
                multiline
                numberOfLines={rows}
                style={withGeistFont([getInputStyle(), inputStyle])}
                placeholderTextColor={error ? withAlpha(danger, 0.6) : muted}
                placeholder={placeholder || "Type your message..."}
                onFocus={handleFocus}
                onBlur={handleBlur}
                editable={!disabled}
                selectionColor={primary}
                accessibilityLabel={accessibleName}
                accessibilityHint={accessibleHint}
                {...props}
              />
            </>
          ) : (
            // Input Layout (Row)
            <View style={styles.row}>
              {/* Left section - Icon + Label (fixed width to simulate grid column) */}
              <View
                style={[styles.rowLeft, label ? styles.rowLeftLabelled : styles.rowLeftAuto]}
                pointerEvents="none"
              >
                {icon && <Icon name={icon} size={16} color={error ? danger : muted} />}
                {label && (
                  <Text
                    variant="caption"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      {
                        fontSize: CONTROL_FONT_SIZE,
                        color: error ? danger : muted,
                      },
                      labelStyle,
                    ]}
                    pointerEvents="none"
                  >
                    {label}
                  </Text>
                )}
              </View>

              {/* TextInput section - takes remaining space */}
              <View style={styles.inputSlot}>
                <TextInput
                  ref={ref}
                  style={withGeistFont([getInputStyle(), inputStyle])}
                  placeholderTextColor={error ? withAlpha(danger, 0.6) : muted}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  editable={!disabled}
                  placeholder={placeholder}
                  selectionColor={primary}
                  accessibilityLabel={accessibleName}
                  accessibilityHint={accessibleHint}
                  {...props}
                />
              </View>

              {/* Right Component */}
              {renderRightComponent()}
            </View>
          )}
        </Pressable>

        {/* Error Message */}
        {error && (
          // `role="alert"` announces the message as it appears, so the failure is not
          // silent for anyone who is not looking at the field turn red.
          <Text role="alert" style={[styles.errorText, { color: danger }, errorStyle]}>
            {error}
          </Text>
        )}
      </View>
    )

    return renderInputContent()
  },
)

Input.displayName = "Input"

export interface GroupedInputProps {
  children: ReactNode
  containerStyle?: ViewStyle
  title?: string
  titleStyle?: TextStyle
}

export const GroupedInput = ({
  children,
  containerStyle,
  title,
  titleStyle,
}: GroupedInputProps) => {
  const border = useColor("border")
  const background = useColor("card")
  const danger = useColor("destructive")

  const childrenArray = Children.toArray(children)

  const errors = childrenArray
    .filter(
      (child): child is ReactElement<any> => isValidElement(child) && !!(child.props as any).error,
    )
    .map((child) => child.props.error)

  const renderGroupedContent = () => (
    <View style={containerStyle}>
      {!!title && (
        <Text variant="title" style={[styles.groupTitle, titleStyle]}>
          {title}
        </Text>
      )}

      <View style={[styles.group, { backgroundColor: background, borderColor: border }]}>
        {childrenArray.map((child, index) => (
          <View
            key={index}
            style={[
              styles.groupRow,
              index !== childrenArray.length - 1 && styles.groupRowDivided,
              { borderColor: border },
            ]}
          >
            {child}
          </View>
        ))}
      </View>

      {errors.length > 0 && (
        <View style={styles.groupErrors}>
          {errors.map((error, i) => (
            // Same contract as `Input`: the group renders its items' errors on their behalf,
            // so the announcement has to happen here — the item has no error Text of its own.
            <Text
              key={i}
              role="alert"
              style={[styles.groupErrorText, i > 0 && styles.groupErrorSpaced, { color: danger }]}
            >
              {error}
            </Text>
          ))}
        </View>
      )}
    </View>
  )

  return renderGroupedContent()
}

export interface GroupedInputItemProps extends Omit<TextInputProps, "style"> {
  label?: string
  error?: string
  icon?: ComponentType<LucideProps>
  rightComponent?: ReactNode | (() => ReactNode)
  inputStyle?: TextStyle
  labelStyle?: TextStyle
  disabled?: boolean
  type?: "input" | "textarea"
  rows?: number // Only used when type="textarea"
}

export const GroupedInputItem = forwardRef<TextInput, GroupedInputItemProps>(
  (
    {
      label,
      error,
      icon,
      rightComponent,
      inputStyle,
      labelStyle,
      disabled,
      type = "input",
      rows = 3,
      onFocus,
      onBlur,
      placeholder,
      accessibilityHint,
      ...props
    },
    ref,
  ) => {
    const text = useColor("text")
    const muted = useColor("textMuted")
    const primary = useColor("primary")
    const danger = useColor("destructive")

    const isTextarea = type === "textarea"

    /** Same contract as `Input`: the sibling label names the field, the placeholder is fallback. */
    const accessibleName = label ?? placeholder

    /**
     * Same contract as `Input` — and it matters more here: a grouped item's error text is
     * rendered by the enclosing `GroupedInput`, several nodes away, so the hint is the only
     * thing tying the reason to the field it belongs to.
     */
    const accessibleHint = accessibilityHint ?? error

    const handleFocus = (e: any) => {
      onFocus?.(e)
    }

    const handleBlur = (e: any) => {
      onBlur?.(e)
    }

    const renderRightComponent = () => {
      if (!rightComponent) return null
      return typeof rightComponent === "function" ? rightComponent() : rightComponent
    }

    const renderItemContent = () => (
      <Pressable
        accessibilityRole="button"
        onPress={() => ref && "current" in ref && ref.current?.focus()}
        disabled={disabled}
        style={disabled && styles.pressableDisabled}
      >
        <View style={[styles.itemBody, isTextarea ? styles.itemBodyColumn : styles.itemBodyRow]}>
          {isTextarea ? (
            // Textarea Layout (Column)
            <>
              {/* Header section with icon, label, and right component */}
              {(icon || label || rightComponent) && (
                <View style={styles.headerRow}>
                  {/* Icon & Label */}
                  <View style={styles.headerLeft} pointerEvents="none">
                    {icon && <Icon name={icon} size={16} color={error ? danger : muted} />}
                    {label && (
                      <Text
                        variant="caption"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={[
                          {
                            fontSize: CONTROL_FONT_SIZE,
                            color: error ? danger : muted,
                          },
                          labelStyle,
                        ]}
                        pointerEvents="none"
                      >
                        {label}
                      </Text>
                    )}
                  </View>

                  {/* Right Component */}
                  {renderRightComponent()}
                </View>
              )}

              {/* Textarea Input */}
              <TextInput
                ref={ref}
                multiline
                numberOfLines={rows}
                style={withGeistFont([
                  {
                    fontSize: FONT_SIZE,
                    lineHeight: 20,
                    color: disabled ? muted : error ? danger : text,
                    textAlignVertical: "top",
                    paddingVertical: 0,
                    minHeight: rows * 20,
                  },
                  inputStyle,
                ])}
                placeholderTextColor={error ? withAlpha(danger, 0.6) : muted}
                placeholder={placeholder || "Type your message..."}
                editable={!disabled}
                selectionColor={primary}
                accessibilityLabel={accessibleName}
                accessibilityHint={accessibleHint}
                onFocus={handleFocus}
                onBlur={handleBlur}
                {...props}
              />
            </>
          ) : (
            // Input Layout (Row)
            <View style={styles.itemRow}>
              {/* Icon & Label */}
              <View
                style={[styles.rowLeft, label ? styles.rowLeftLabelled : styles.rowLeftAuto]}
                pointerEvents="none"
              >
                {icon && <Icon name={icon} size={16} color={error ? danger : muted} />}
                {label && (
                  <Text
                    variant="caption"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      {
                        fontSize: CONTROL_FONT_SIZE,
                        color: error ? danger : muted,
                      },
                      labelStyle,
                    ]}
                    pointerEvents="none"
                  >
                    {label}
                  </Text>
                )}
              </View>

              {/* Input */}
              <View style={styles.inputSlot}>
                <TextInput
                  ref={ref}
                  style={withGeistFont([
                    {
                      flex: 1,
                      fontSize: FONT_SIZE,
                      color: disabled ? muted : error ? danger : text,
                      paddingVertical: 0,
                    },
                    inputStyle,
                  ])}
                  placeholder={placeholder}
                  placeholderTextColor={error ? withAlpha(danger, 0.6) : muted}
                  editable={!disabled}
                  selectionColor={primary}
                  accessibilityLabel={accessibleName}
                  accessibilityHint={accessibleHint}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  {...props}
                />
              </View>

              {/* Right Component */}
              {renderRightComponent()}
            </View>
          )}
        </View>
      </Pressable>
    )

    return renderItemContent()
  },
)

GroupedInputItem.displayName = "GroupedInputItem"

const styles = StyleSheet.create({
  errorText: {
    fontSize: CONTROL_FONT_SIZE,
    marginLeft: 14,
    marginTop: 4,
  },
  group: {
    borderRadius: RADIUS["3xl"],
    borderWidth: 1,
    overflow: "hidden",
  },
  groupErrorSpaced: {
    marginTop: 1,
  },
  groupErrorText: {
    fontSize: CONTROL_FONT_SIZE,
    marginLeft: 8,
  },
  groupErrors: {
    marginTop: 6,
  },
  groupRow: {
    justifyContent: "center",
    minHeight: HEIGHT,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  groupRowDivided: {
    borderBottomWidth: 1,
  },
  groupTitle: {
    marginBottom: 8,
    marginLeft: 8,
  },
  headerLeft: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  inputSlot: {
    flex: 1,
  },
  itemBody: {
    backgroundColor: TRANSPARENT,
  },
  itemBodyColumn: {
    alignItems: "stretch",
    flexDirection: "column",
  },
  itemBodyRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  itemRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  pressableDisabled: {
    opacity: 0.6,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  rowLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  rowLeftAuto: {
    width: "auto",
  },
  rowLeftLabelled: {
    width: 120,
  },
})
