import React, { useState } from "react"

import { ModeToggle, ThemePreference } from "@/components/ui/mode-toggle"

export function ModeToggleDemo() {
  const [preference, setPreference] = useState<ThemePreference>("system")

  return (
    <ModeToggle
      value={preference}
      onValueChange={setPreference}
      labels={{ light: "Light", dark: "Dark", system: "System" }}
    />
  )
}
