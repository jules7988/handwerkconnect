module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // nur wenn expo-router im Projekt ist (empfohlen):
      'expo-router/babel',
      // falls du react-native-reanimated verwendest, hänge das *als letztes* Plugin an:
      // 'react-native-reanimated/plugin',
    ],
  };
};
