# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# react-native-worklets (Reanimated 4.x peer dependency)
-keep class com.swmansion.worklets.** { *; }

# react-native-gesture-handler
-keep class com.swmansion.gesturehandler.** { *; }

# Hermes engine
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Expo modules
-keep class expo.modules.** { *; }

# React Native core
-keep class com.facebook.react.** { *; }
-keepclassmembers class * { @com.facebook.react.uimanager.annotations.ReactProp *; }
-keepclassmembers class * { @com.facebook.react.uimanager.annotations.ReactPropGroup *; }

# Don't strip native methods
-keepclasseswithmembernames class * { native <methods>; }

# AsyncStorage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# TanStack Query (React Query)
-keep class com.tanstack.** { *; }
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.proguard.annotations.KeepGettersAndSetters *;
}

# react-native-paper
-keep class com.reactnativepaper.** { *; }

# Add any project specific keep options here:
