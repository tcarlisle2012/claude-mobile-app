module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|expo-modules-core|expo-status-bar|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@react-native-async-storage/async-storage|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-worklets|react-native-drawer-layout|i18next|react-i18next)/)',
  ],
  moduleNameMapper: {
    '@react-native-async-storage/async-storage':
      '@react-native-async-storage/async-storage/jest/async-storage-mock',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
};
