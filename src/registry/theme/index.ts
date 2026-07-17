export const themeRegistry = {
  colors: {
    name: 'colors',
    description: 'colors',
    type: 'registry:theme',
    dependencies: [],
    files: [
      {
        type: 'registry:theme',
        path: 'templates/theme/colors.ts',
        target: 'theme/colors.ts',
      },
    ],
  },

  colorUtils: {
    name: 'colorUtils',
    description: 'colorUtils',
    type: 'registry:theme',
    dependencies: [],
    files: [
      {
        type: 'registry:theme',
        path: 'templates/theme/colorUtils.ts',
        target: 'theme/colorUtils.ts',
      },
    ],
  },

  typography: {
    name: 'typography',
    description: 'typography',
    type: 'registry:theme',
    dependencies: [],
    files: [
      {
        type: 'registry:theme',
        path: 'templates/theme/typography.ts',
        target: 'theme/typography.ts',
      },
    ],
  },

  globals: {
    name: 'globals',
    description: 'globals',
    type: 'registry:theme',
    dependencies: [],
    files: [
      {
        type: 'registry:theme',
        path: 'templates/theme/globals.ts',
        target: 'theme/globals.ts',
      },
    ],
  },

  'theme-provider': {
    name: 'theme-provider',
    description: 'Theme Provider',
    type: 'registry:theme',
    dependencies: [],
    files: [
      {
        type: 'registry:theme',
        path: 'templates/theme/theme-provider.tsx',
        target: 'theme/theme-provider.tsx',
      },
    ],
  },
};
