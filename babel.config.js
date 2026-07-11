module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // react-native-worklets/plugin powers Reanimated v4 and MUST be listed last.
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          config: './tamagui.config.ts',
          components: ['tamagui'],
        },
      ],
      'react-native-worklets/plugin',
    ],
  };
};
