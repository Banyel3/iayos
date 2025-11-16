/**
 * SearchBar Component - Production-ready search bar matching Next.js design
 *
 * Features:
 * - 48px height (standard Next.js input height)
 * - Search icon (left)
 * - Clear button (right, appears when text entered)
 * - Filter button (optional, right)
 * - Rounded corners (8px)
 * - Light gray background
 * - Haptic feedback on clear
 */

import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface SearchBarProps {
  // Content
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;

  // Features
  showFilterButton?: boolean;
  onFilterPress?: () => void;

  // Styling
  style?: ViewStyle;
  inputStyle?: TextStyle;

  // Behavior
  autoFocus?: boolean;
  onSubmit?: () => void;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  showFilterButton = false,
  onFilterPress,
  style,
  inputStyle,
  autoFocus = false,
  onSubmit,
}: SearchBarProps) {

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeText('');
  };

  const handleFilterPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFilterPress?.();
  };

  return (
    <View style={[styles.container, style]}>
      {/* Search Icon */}
      <Ionicons
        name="search-outline"
        size={20}
        color={Colors.textHint}
        style={styles.searchIcon}
      />

      {/* Input */}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textHint}
        autoFocus={autoFocus}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        style={[styles.input, inputStyle]}
      />

      {/* Clear Button */}
      {value.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          style={styles.clearButton}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons
            name="close-circle"
            size={20}
            color={Colors.textHint}
          />
        </TouchableOpacity>
      )}

      {/* Filter Button */}
      {showFilterButton && (
        <TouchableOpacity
          onPress={handleFilterPress}
          style={styles.filterButton}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    paddingVertical: 0, // Remove default padding
  },
  clearButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  filterButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    paddingLeft: Spacing.md,
  },
});
