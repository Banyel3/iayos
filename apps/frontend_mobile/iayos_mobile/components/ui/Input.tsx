/**
 * Input Component - Production-ready text input matching Next.js design
 *
 * Features:
 * - Height: 48px
 * - Border: 1px solid #E5E7EB
 * - Focus state: 2px border #3B82F6 with shadow
 * - Error state: red border with error message
 * - Icon support (left/right)
 * - Password toggle
 */

import React, { useState } from "react";
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  TextInputProps as RNTextInputProps,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";

interface InputProps extends RNTextInputProps {
  // Label
  label?: string;
  required?: boolean;

  // Icons
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;

  // Error handling
  error?: string;
  touched?: boolean;

  // Password toggle
  isPassword?: boolean;

  // Custom styles
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

const Input = React.forwardRef<
  React.ComponentRef<typeof RNTextInput>,
  InputProps
>(
  (
    {
      label,
      required = false,
      iconLeft,
      iconRight,
      error,
      touched = false,
      isPassword = false,
      containerStyle,
      inputStyle,
      labelStyle,
      ...textInputProps
    }: InputProps,
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Debug: log mount/unmount to detect unexpected remounts
    React.useEffect(() => {
      try {
        // label may be undefined for some inputs
        // eslint-disable-next-line no-console
        console.log("[Input] mounted", { label });
      } catch (e) {}
      return () => {
        try {
          // eslint-disable-next-line no-console
          console.log("[Input] unmounted", { label });
        } catch (e) {}
      };
    }, [label]);

    const hasError = touched && error;

    return (
      <View style={[styles.container, containerStyle]}>
        {/* Label */}
        {label && (
          <Text style={[styles.label, labelStyle]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        )}

        {/* Input Wrapper */}
        <View
          style={[
            styles.inputWrapper,
            isFocused && styles.inputFocused,
            hasError && styles.inputError,
          ]}
        >
          {/* Left Icon */}
          {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}

          {/* Text Input */}
          <RNTextInput
            ref={ref}
            style={[styles.input, inputStyle]}
            placeholderTextColor={Colors.textHint}
            onFocus={() => {
              // eslint-disable-next-line no-console
              console.log("[Input] onFocus", { label });
              setIsFocused(true);
              if (textInputProps.onFocus) {
                try {
                  // forward event
                  // @ts-ignore - allow forwarding the native event if provided
                  textInputProps.onFocus();
                } catch (e) {}
              }
            }}
            onBlur={() => {
              // eslint-disable-next-line no-console
              console.log("[Input] onBlur", { label });
              setIsFocused(false);
              if (textInputProps.onBlur) {
                try {
                  // @ts-ignore
                  textInputProps.onBlur();
                } catch (e) {}
              }
            }}
            secureTextEntry={isPassword && !showPassword}
            {...textInputProps}
          />

          {/* Right Icon or Password Toggle */}
          {isPassword ? (
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.iconRight}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          ) : (
            iconRight && <View style={styles.iconRight}>{iconRight}</View>
          )}
        </View>

        {/* Error Message */}
        {hasError && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    );
  }
);

export default Input;

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  required: {
    color: Colors.error,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
  },
  inputFocused: {
    borderWidth: 2,
    borderColor: Colors.primary,
    ...Shadows.focus,
  },
  inputError: {
    borderColor: Colors.error,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    paddingVertical: 0, // Reset padding for consistent height
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.error,
    marginLeft: Spacing.xs,
  },
});
