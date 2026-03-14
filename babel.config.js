module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // optional, falls du nativewind wirklich verwendest:
      // 'nativewind/babel',

      // WICHTIG: muss als letztes stehen
      'react-native-reanimated/plugin',
    ],
  };
};