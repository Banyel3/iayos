// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Detect if running in Expo Go (no native modules available)
// We use EXPO_PUBLIC_APP_VARIANT or check if it's a dev client
const isExpoGo = process.env.EXPO_PUBLIC_APP_VARIANT !== "development";

// Mock react-native-agora in Expo Go to prevent native module linking errors
if (isExpoGo) {
  config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    "react-native-agora": require.resolve("./lib/mocks/react-native-agora.js"),
  };
}

module.exports = config;
