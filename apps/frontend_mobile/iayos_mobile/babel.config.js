module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // react-native-reanimated/plugin MUST be listed last
      // This ensures worklets are properly transformed for release builds
      "react-native-reanimated/plugin",
    ],
  };
};
