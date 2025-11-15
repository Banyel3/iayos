/**
 * Notification Settings Screen
 * Manage notification preferences and do-not-disturb schedule
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import {
  Text,
  Appbar,
  Switch,
  List,
  Divider,
  Button,
  Portal,
  Dialog,
  ActivityIndicator,
} from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';

import {
  useNotificationSettings,
  useUpdateNotificationSettings,
  NotificationSettings,
} from '@/lib/hooks/useNotifications';

export default function NotificationSettingsScreen() {
  const { data: settings, isLoading, isError, error } = useNotificationSettings();
  const updateSettingsMutation = useUpdateNotificationSettings();

  // Local state for settings
  const [localSettings, setLocalSettings] = useState<Partial<NotificationSettings>>({
    pushEnabled: true,
    soundEnabled: true,
    jobUpdates: true,
    messages: true,
    payments: true,
    reviews: true,
    kycUpdates: true,
    doNotDisturbStart: null,
    doNotDisturbEnd: null,
  });

  // Time picker state
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Update local state when settings are fetched
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  // Toggle setting
  const toggleSetting = (key: keyof NotificationSettings) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newValue = !localSettings[key];
    const updatedSettings = { ...localSettings, [key]: newValue };
    setLocalSettings(updatedSettings);

    // Update backend
    updateSettingsMutation.mutate(
      { [key]: newValue },
      {
        onSuccess: () => {
          Toast.show({
            type: 'success',
            text1: 'Settings updated',
          });
        },
        onError: () => {
          // Revert on error
          setLocalSettings(localSettings);
          Toast.show({
            type: 'error',
            text1: 'Failed to update settings',
          });
        },
      }
    );
  };

  // Update do-not-disturb time
  const updateDndTime = (type: 'start' | 'end', time: string | null) => {
    const key = type === 'start' ? 'doNotDisturbStart' : 'doNotDisturbEnd';
    const updatedSettings = { ...localSettings, [key]: time };
    setLocalSettings(updatedSettings);

    updateSettingsMutation.mutate(
      { [key]: time },
      {
        onSuccess: () => {
          Toast.show({
            type: 'success',
            text1: 'Do Not Disturb updated',
          });
        },
      }
    );
  };

  // Clear do-not-disturb schedule
  const clearDndSchedule = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const updatedSettings = {
      ...localSettings,
      doNotDisturbStart: null,
      doNotDisturbEnd: null,
    };
    setLocalSettings(updatedSettings);

    updateSettingsMutation.mutate(
      { doNotDisturbStart: null, doNotDisturbEnd: null },
      {
        onSuccess: () => {
          Toast.show({
            type: 'success',
            text1: 'Do Not Disturb cleared',
          });
        },
      }
    );
  };

  // Handle time picker change
  const handleTimeChange = (
    event: any,
    selectedTime: Date | undefined,
    type: 'start' | 'end'
  ) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
      setShowEndTimePicker(false);
    }

    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      updateDndTime(type, timeString);
    }
  };

  // Format time for display
  const formatTime = (time: string | null) => {
    if (!time) return 'Not set';
    return time;
  };

  // Parse time string to Date
  const parseTime = (time: string | null): Date => {
    if (!time) return new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    return date;
  };

  // Error state
  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Notification Settings" />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load settings</Text>
          <Text style={styles.errorSubtext}>{error?.message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Notification Settings" />
      </Appbar.Header>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {/* Global Settings */}
          <List.Section>
            <List.Subheader>General</List.Subheader>
            <List.Item
              title="Push Notifications"
              description="Enable push notifications"
              left={(props) => <List.Icon {...props} icon="bell-outline" />}
              right={() => (
                <Switch
                  value={localSettings.pushEnabled}
                  onValueChange={() => toggleSetting('pushEnabled')}
                  color="#007AFF"
                />
              )}
            />
            <Divider />
            <List.Item
              title="Sound"
              description="Play sound for notifications"
              left={(props) => <List.Icon {...props} icon="volume-high" />}
              right={() => (
                <Switch
                  value={localSettings.soundEnabled}
                  onValueChange={() => toggleSetting('soundEnabled')}
                  disabled={!localSettings.pushEnabled}
                  color="#007AFF"
                />
              )}
            />
          </List.Section>

          <Divider style={styles.sectionDivider} />

          {/* Category Settings */}
          <List.Section>
            <List.Subheader>Notification Categories</List.Subheader>
            <List.Item
              title="Job Updates"
              description="Applications, status changes, completions"
              left={(props) => <List.Icon {...props} icon="briefcase" />}
              right={() => (
                <Switch
                  value={localSettings.jobUpdates}
                  onValueChange={() => toggleSetting('jobUpdates')}
                  disabled={!localSettings.pushEnabled}
                  color="#007AFF"
                />
              )}
            />
            <Divider />
            <List.Item
              title="Messages"
              description="New messages from clients and workers"
              left={(props) => <List.Icon {...props} icon="message-text" />}
              right={() => (
                <Switch
                  value={localSettings.messages}
                  onValueChange={() => toggleSetting('messages')}
                  disabled={!localSettings.pushEnabled}
                  color="#007AFF"
                />
              )}
            />
            <Divider />
            <List.Item
              title="Payments"
              description="Payment confirmations and updates"
              left={(props) => <List.Icon {...props} icon="cash" />}
              right={() => (
                <Switch
                  value={localSettings.payments}
                  onValueChange={() => toggleSetting('payments')}
                  disabled={!localSettings.pushEnabled}
                  color="#007AFF"
                />
              )}
            />
            <Divider />
            <List.Item
              title="Reviews"
              description="New reviews and ratings"
              left={(props) => <List.Icon {...props} icon="star" />}
              right={() => (
                <Switch
                  value={localSettings.reviews}
                  onValueChange={() => toggleSetting('reviews')}
                  disabled={!localSettings.pushEnabled}
                  color="#007AFF"
                />
              )}
            />
            <Divider />
            <List.Item
              title="KYC Updates"
              description="Verification status changes"
              left={(props) => <List.Icon {...props} icon="shield-check" />}
              right={() => (
                <Switch
                  value={localSettings.kycUpdates}
                  onValueChange={() => toggleSetting('kycUpdates')}
                  disabled={!localSettings.pushEnabled}
                  color="#007AFF"
                />
              )}
            />
          </List.Section>

          <Divider style={styles.sectionDivider} />

          {/* Do Not Disturb Schedule */}
          <List.Section>
            <List.Subheader>Do Not Disturb</List.Subheader>
            <List.Item
              title="Start Time"
              description={formatTime(localSettings.doNotDisturbStart)}
              left={(props) => <List.Icon {...props} icon="clock-start" />}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowStartTimePicker(true);
              }}
              disabled={!localSettings.pushEnabled}
            />
            <Divider />
            <List.Item
              title="End Time"
              description={formatTime(localSettings.doNotDisturbEnd)}
              left={(props) => <List.Icon {...props} icon="clock-end" />}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowEndTimePicker(true);
              }}
              disabled={!localSettings.pushEnabled}
            />
            {(localSettings.doNotDisturbStart || localSettings.doNotDisturbEnd) && (
              <>
                <Divider />
                <View style={styles.clearButton}>
                  <Button
                    mode="outlined"
                    onPress={clearDndSchedule}
                    textColor="#F44336"
                  >
                    Clear Schedule
                  </Button>
                </View>
              </>
            )}
          </List.Section>

          {/* Info Text */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              During Do Not Disturb hours, you won't receive push notifications. You
              can still view notifications in the app.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Time Pickers */}
      {showStartTimePicker && (
        <DateTimePicker
          value={parseTime(localSettings.doNotDisturbStart)}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, time) => handleTimeChange(event, time, 'start')}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={parseTime(localSettings.doNotDisturbEnd)}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, time) => handleTimeChange(event, time, 'end')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  sectionDivider: {
    height: 8,
    backgroundColor: '#F5F5F5',
  },
  clearButton: {
    padding: 16,
  },
  infoContainer: {
    padding: 16,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    textAlign: 'center',
  },
});
