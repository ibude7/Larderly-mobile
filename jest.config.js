module.exports = {
  preset: 'jest-expo',
  testMatch: [
    '**/src/lib/__tests__/**/*.test.ts',
    '**/src/components/**/__tests__/**/*.test.tsx',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-css-interop|nativewind|expo|expo-.*|@expo(nent)?/.*|@expo/.*|@react-navigation/.*|react-native-svg|@hugeicons/.*|tamagui|@tamagui/.*)/)',
  ],
};
