import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import * as Application from 'expo-application';
import * as Linking from 'expo-linking';

const THEME_STORAGE_KEY = '@iayos_theme';
const LANGUAGE_STORAGE_KEY = '@iayos_language';

export default function SettingsScreen() {
  const queryClient = useQueryClient();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState<'en' | 'tl'>('en');

  const appVersion = Application.nativeApplicationVersion || '1.0.0';
  const buildNumber = Application.nativeBuildVersion || '1';

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme ? 'dark' : 'light');
    Alert.alert('Theme Updated', 'The app theme will update on next launch.');
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    Alert.alert(
      'Notifications',
      notificationsEnabled
        ? 'Notifications have been disabled.'
        : 'Notifications have been enabled.'
    );
  };

  const changeLanguage = () => {
    Alert.alert(
      'Change Language',
      'Select your preferred language',
      [
        {
          text: 'English',
          onPress: async () => {
            setLanguage('en');
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
          },
        },
        {
          text: 'Filipino (Tagalog)',
          onPress: async () => {
            setLanguage('tl');
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'tl');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const clearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Are you sure?',
      [
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await queryClient.clear();
            Alert.alert('Success', 'Cache cleared successfully.');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const deleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Type "DELETE" to confirm account deletion',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Proceed',
                  onPress: () => {
                    // TODO: Implement account deletion API call
                    Alert.alert('Account Deletion', 'Please contact support to delete your account.');
                  },
                },
              ]
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const navigateTo = (path: string) => {
    router.push(path as any);
  };

  const openURL = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <SettingsItem
          icon="person-outline"
          label="Edit Profile"
          onPress={() => navigateTo('/profile/edit')}
          showChevron
        />

        <SettingsItem
          icon="shield-checkmark-outline"
          label="Privacy & Security"
          onPress={() => navigateTo('/settings/privacy')}
          showChevron
        />

        <SettingsItem
          icon="lock-closed-outline"
          label="Change Password"
          onPress={() => navigateTo('/settings/password')}
          showChevron
        />
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <SettingsItem
          icon="moon-outline"
          label="Dark Mode"
          rightElement={
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              thumbColor={isDarkMode ? '#FFFFFF' : '#FFFFFF'}
            />
          }
        />

        <SettingsItem
          icon="notifications-outline"
          label="Notifications"
          rightElement={
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              thumbColor={notificationsEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          }
        />

        <SettingsItem
          icon="language-outline"
          label="Language"
          subtitle={language === 'en' ? 'English' : 'Filipino (Tagalog)'}
          onPress={changeLanguage}
          showChevron
        />
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>

        <SettingsItem
          icon="help-circle-outline"
          label="Help Center"
          onPress={() => navigateTo('/help/faq')}
          showChevron
        />

        <SettingsItem
          icon="chatbubble-outline"
          label="Contact Support"
          onPress={() => navigateTo('/help/contact')}
          showChevron
        />

        <SettingsItem
          icon="flag-outline"
          label="Report a Problem"
          onPress={() => navigateTo('/dispute/create')}
          showChevron
        />
      </View>

      {/* Legal Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>

        <SettingsItem
          icon="document-text-outline"
          label="Terms of Service"
          onPress={() => openURL('https://iayos.com/terms')}
          showChevron
        />

        <SettingsItem
          icon="shield-outline"
          label="Privacy Policy"
          onPress={() => openURL('https://iayos.com/privacy')}
          showChevron
        />

        <SettingsItem
          icon="information-circle-outline"
          label="Licenses"
          onPress={() => navigateTo('/settings/licenses')}
          showChevron
        />
      </View>

      {/* Data & Storage Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Storage</Text>

        <SettingsItem
          icon="trash-outline"
          label="Clear Cache"
          subtitle="Free up storage space"
          onPress={clearCache}
          showChevron
        />
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>

        <SettingsItem
          icon="log-out-outline"
          label="Logout"
          onPress={() => {
            Alert.alert(
              'Logout',
              'Are you sure you want to logout?',
              [
                {
                  text: 'Logout',
                  style: 'destructive',
                  onPress: () => {
                    // TODO: Implement logout
                    router.replace('/auth/login' as any);
                  },
                },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }}
          showChevron
          danger
        />

        <SettingsItem
          icon="trash-bin-outline"
          label="Delete Account"
          subtitle="Permanently delete your account"
          onPress={deleteAccount}
          showChevron
          danger
        />
      </View>

      {/* App Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>iAyos Mobile</Text>
        <Text style={styles.footerText}>
          Version {appVersion} ({buildNumber})
        </Text>
        <Text style={styles.footerText}>© 2025 iAyos. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  danger?: boolean;
}

function SettingsItem({
  icon,
  label,
  subtitle,
  onPress,
  rightElement,
  showChevron,
  danger,
}: SettingsItemProps) {
  const content = (
    <View style={styles.settingsItem}>
      <View style={styles.settingsItemLeft}>
        <Ionicons
          name={icon}
          size={24}
          color={danger ? '#EF4444' : '#6B7280'}
          style={styles.settingsItemIcon}
        />
        <View style={styles.settingsItemText}>
          <Text style={[styles.settingsItemLabel, danger && styles.dangerText]}>
            {label}
          </Text>
          {subtitle && <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingsItemRight}>
        {rightElement}
        {showChevron && (
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemIcon: {
    marginRight: 12,
  },
  settingsItemText: {
    flex: 1,
  },
  settingsItemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  settingsItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dangerText: {
    color: '#EF4444',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
    textAlign: 'center',
  },
});
