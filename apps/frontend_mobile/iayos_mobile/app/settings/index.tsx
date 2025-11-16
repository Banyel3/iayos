import React, { useState, useEffect } from 'react';
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
import ProfileMenuItem from '@/components/profile/ProfileMenuItem';
import { useLogout } from '@/lib/hooks/useLogout';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

const THEME_STORAGE_KEY = '@iayos_theme';
const LANGUAGE_STORAGE_KEY = '@iayos_language';

export default function SettingsScreen() {
  const queryClient = useQueryClient();
  const { data: userProfile, isLoading } = useUserProfile();
  const logout = useLogout();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState<'en' | 'tl'>('en');

  const appVersion = Application.nativeApplicationVersion || '1.0.0';
  const buildNumber = Application.nativeBuildVersion || '1';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const theme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      const lang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

      if (theme) setIsDarkMode(theme === 'dark');
      if (lang) setLanguage(lang as 'en' | 'tl');
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

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

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => logout.mutate(),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      {userProfile && (
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Ionicons name="person" size={40} color="#3B82F6" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {userProfile.firstName} {userProfile.lastName}
            </Text>
            <Text style={styles.profileEmail}>{userProfile.email}</Text>
          </View>
        </View>
      )}

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <ProfileMenuItem
          icon="person-outline"
          title="Edit Profile"
          onPress={() => navigateTo('/profile/edit')}
          showChevron
        />

        <ProfileMenuItem
          icon="lock-closed-outline"
          title="Change Password"
          onPress={() => navigateTo('/settings/change-password')}
          showChevron
        />
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <ProfileMenuItem
          icon="moon-outline"
          title="Dark Mode"
          subtitle="Toggle between light and dark theme"
          onPress={() => {}}
          showChevron={false}
          rightElement={
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              thumbColor={isDarkMode ? '#FFFFFF' : '#FFFFFF'}
            />
          }
        />

        <ProfileMenuItem
          icon="notifications-outline"
          title="Notifications"
          subtitle="Manage notification preferences"
          onPress={() => {}}
          showChevron={false}
          rightElement={
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              thumbColor={notificationsEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          }
        />

        <ProfileMenuItem
          icon="language-outline"
          title="Language"
          subtitle={language === 'en' ? 'English' : 'Filipino (Tagalog)'}
          onPress={changeLanguage}
          showChevron
        />
      </View>

      {/* Help & Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Help & Support</Text>

        <ProfileMenuItem
          icon="help-circle-outline"
          title="Help Center / FAQ"
          subtitle="Find answers to common questions"
          onPress={() => navigateTo('/help/faq')}
          showChevron
        />

        <ProfileMenuItem
          icon="chatbubble-outline"
          title="Contact Support"
          subtitle="Get help from our team"
          onPress={() => navigateTo('/help/contact')}
          showChevron
        />

        <ProfileMenuItem
          icon="flag-outline"
          title="Report a Bug"
          subtitle="Help us improve the app"
          onPress={() => navigateTo('/help/contact')}
          showChevron
        />
      </View>

      {/* Privacy Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Legal</Text>

        <ProfileMenuItem
          icon="shield-outline"
          title="Privacy Policy"
          onPress={() => openURL('https://iayos.com/privacy')}
          showChevron
        />

        <ProfileMenuItem
          icon="document-text-outline"
          title="Terms of Service"
          onPress={() => openURL('https://iayos.com/terms')}
          showChevron
        />

        <ProfileMenuItem
          icon="lock-closed-outline"
          title="Data & Privacy"
          subtitle="Manage your data and privacy settings"
          onPress={() => navigateTo('/settings/privacy')}
          showChevron
        />
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>

        <ProfileMenuItem
          icon="information-circle-outline"
          title="App Version"
          value={`${appVersion} (${buildNumber})`}
          onPress={() => {}}
          showChevron={false}
        />

        <ProfileMenuItem
          icon="star-outline"
          title="Rate Us"
          subtitle="Love the app? Give us a rating!"
          onPress={() => {
            // Platform specific app store URL
            const url = Platform.OS === 'ios'
              ? 'https://apps.apple.com/app/iayos'
              : 'https://play.google.com/store/apps/details?id=com.iayos';
            openURL(url);
          }}
          showChevron
        />

        <ProfileMenuItem
          icon="share-social-outline"
          title="Share App"
          subtitle="Invite friends to join iAyos"
          onPress={() => {
            Alert.alert('Share iAyos', 'Share feature coming soon!');
          }}
          showChevron
        />
      </View>

      {/* Data & Storage Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Storage</Text>

        <ProfileMenuItem
          icon="trash-outline"
          title="Clear Cache"
          subtitle="Free up storage space"
          onPress={clearCache}
          showChevron
        />
      </View>

      {/* Logout Section */}
      <View style={styles.section}>
        <ProfileMenuItem
          icon="log-out-outline"
          title="Logout"
          subtitle="Sign out of your account"
          onPress={handleLogout}
          showChevron
          danger
        />

        <ProfileMenuItem
          icon="trash-bin-outline"
          title="Delete Account"
          subtitle="Permanently delete your account"
          onPress={deleteAccount}
          showChevron
          danger
        />
      </View>

      {/* App Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>iAyos Mobile</Text>
        <Text style={styles.footerText}>© 2025 iAyos. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
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
