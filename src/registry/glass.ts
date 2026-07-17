// Registry configuration for glass component

export const glassRegistry = {
  // Main glass component
  glass: {
    name: 'glass',
    description:
      'A translucent surface: a real blur on iOS, an opaque card on every other platform by contract.',
    type: 'registry:ui',
    dependencies: ['expo-blur'],
    registryDependencies: [],
    hooks: ['useColor', 'useColorScheme'],
    theme: ['colorUtils'],
    files: [
      {
        type: 'registry:ui',
        path: 'templates/components/ui/glass.tsx',
        target: 'components/ui/glass.tsx',
      },
    ],
  },
};
