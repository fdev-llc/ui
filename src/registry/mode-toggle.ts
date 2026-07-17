// Registry configuration for mode-toggle component and demo

export const modeToggleRegistry = {
  // Main mode-toggle component
  'mode-toggle': {
    name: 'mode-toggle',
    // Controlled: the caller owns the preference and the labels. The component
    // never calls Appearance and never persists.
    description:
      'A controlled three-choice theme picker (light/dark/system) with radiogroup semantics.',
    type: 'registry:ui',
    dependencies: ['lucide-react-native'],
    registryDependencies: ['button', 'icon', 'text'],
    hooks: ['useColor'],
    theme: ['globals'],
    files: [
      {
        type: 'registry:ui',
        path: 'templates/components/ui/mode-toggle.tsx',
        target: 'components/ui/mode-toggle.tsx',
      },
    ],
    preview: {
      light:
        'https://cdn.jsdelivr.net/gh/ahmedbna/bna-ui-demo/ScreenRecording_07-01-2025 07-11-16_1.MP4',
      dark: 'https://cdn.jsdelivr.net/gh/ahmedbna/bna-ui-demo/ScreenRecording_07-01-2025 07-11-16_1.MP4',
    },
  },

  // Default demo
  'mode-toggle-demo': {
    name: 'mode-toggle-demo',
    description: 'Controlled three-choice theme picker',
    type: 'registry:example',
    registryDependencies: ['mode-toggle'],
    hooks: [],
    theme: [],
    files: [
      {
        type: 'registry:example',
        path: 'templates/demo/mode-toggle/mode-toggle-demo.tsx',
        target: 'components/demo/mode-toggle/mode-toggle-demo.tsx',
      },
    ],
    preview: {
      light:
        'https://cdn.jsdelivr.net/gh/ahmedbna/bna-ui-demo/ScreenRecording_07-01-2025 07-11-16_1.MP4',
      dark: 'https://cdn.jsdelivr.net/gh/ahmedbna/bna-ui-demo/ScreenRecording_07-01-2025 07-11-16_1.MP4',
    },
  },
};
