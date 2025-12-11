import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface ProfileMenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
  showChevron?: boolean;
  disabled?: boolean;
  rightElement?: React.ReactNode;
}

export default function ProfileMenuItem({
  icon,
  title,
  subtitle,
  value,
  onPress,
  danger = false,
  showChevron = true,
  disabled = false,
  rightElement,
}: ProfileMenuItemProps) {
  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.container, disabled && styles.containerDisabled]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={icon}
          size={24}
          color={danger ? '#EF4444' : '#3B82F6'}
        />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, danger && styles.dangerText]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {value && <Text style={styles.value}>{value}</Text>}

      {rightElement}

      {showChevron && !rightElement && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  containerDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  value: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  dangerText: {
    color: '#EF4444',
  },
});
