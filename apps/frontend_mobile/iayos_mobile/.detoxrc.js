/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: "jest",
      config: "e2e/jest.config.js",
    },
    jest: {
      setupTimeout: 300000, // 5 minutes - match APP_LAUNCH_TIMEOUT for Android emulator
      teardownTimeout: 120000,
      retries: 2, // Retry flaky tests
    },
  },
  artifacts: {
    rootDir: "e2e/artifacts",
    pathBuilder: "./e2e/pathBuilder.js",
    plugins: {
      log: { enabled: true },
      screenshot: {
        shouldTakeAutomaticSnapshots: true,
        keepOnlyFailedTestsArtifacts: true,
      },
      video: {
        android: { enabled: false },
        ios: { enabled: false },
      },
      uiHierarchy: "enabled",
    },
  },
  apps: {
    "ios.debug": {
      type: "ios.app",
      binaryPath:
        "ios/build/Build/Products/Debug-iphonesimulator/iayosmobile.app",
      build:
        "xcodebuild -workspace ios/iayosmobile.xcworkspace -scheme iayosmobile -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build -quiet",
    },
    "ios.release": {
      type: "ios.app",
      binaryPath:
        "ios/build/Build/Products/Release-iphonesimulator/iayosmobile.app",
      build:
        "xcodebuild -workspace ios/iayosmobile.xcworkspace -scheme iayosmobile -configuration Release -sdk iphonesimulator -derivedDataPath ios/build -quiet",
    },
    "android.debug": {
      type: "android.apk",
      binaryPath: "android/app/build/outputs/apk/debug/app-debug.apk",
      testBinaryPath:
        "android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk",
      build:
        "cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug --no-daemon -q",
      // Port 8081: Metro bundler, Port 8000: Backend API
      // ADB reverse allows emulator to reach host machine services via localhost
      reversePorts: [8081, 8000],
    },
    "android.release": {
      type: "android.apk",
      binaryPath: "android/app/build/outputs/apk/release/app-release.apk",
      testBinaryPath:
        "android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk",
      build:
        "cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release --no-daemon -q",
    },
  },
  devices: {
    simulator: {
      type: "ios.simulator",
      device: {
        type: "iPhone 15",
      },
    },
    emulator: {
      type: "android.emulator",
      device: {
        avdName: "test_avd",
      },
    },
    attached: {
      type: "android.attached",
      device: {
        adbName: ".*",
      },
    },
  },
  configurations: {
    "ios.sim.debug": {
      device: "simulator",
      app: "ios.debug",
    },
    "ios.sim.release": {
      device: "simulator",
      app: "ios.release",
    },
    "android.emu.debug": {
      device: "emulator",
      app: "android.debug",
    },
    "android.emu.release": {
      device: "emulator",
      app: "android.release",
    },
    "android.att.debug": {
      device: "attached",
      app: "android.debug",
    },
  },
  behavior: {
    init: {
      exposeGlobals: true,
    },
    cleanup: {
      shutdownDevice: false,
    },
  },
};
