// Provenance: Findie web design tokens — apps/ui global.css --radius (10px base) x @theme factors.
// The consumer regenerates these via its token pipeline; these are the fork's fixed defaults.
export const RADIUS = {
  "sm": 6,
  "md": 8,
  "lg": 10,
  "xl": 14,
  "2xl": 18,
  "3xl": 22,
  "4xl": 26,
} as const

export const CORNERS = 999
export const HEIGHT = 44
export const FONT_SIZE = 16
export const CONTROL_FONT_SIZE = 14

/** @deprecated use RADIUS */
export const BORDER_RADIUS = RADIUS["4xl"]
