/**
 * UpdateRequiredModal - Blocking modal for required app updates
 * 
 * Shows a full-screen modal when the app version is below minimum required.
 * Non-dismissible when force_update is true.
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Image,
  Platform,
  BackHandler,
} from 'react-native';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

interface UpdateRequiredModalProps {
  visible: boolean;
  installedVersion: string;
  currentVersion: string;
  downloadUrl: string;
  forceUpdate: boolean;
  onDismiss?: () => void;
}

export function UpdateRequiredModal({
  visible,
  installedVersion,
  currentVersion,
  downloadUrl,
  forceUpdate,
  onDismiss,
}: UpdateRequiredModalProps) {
  
  // Block Android back button when force update is required
  useEffect(() => {
    if (!visible || !forceUpdate) return;
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Prevent back navigation when force update is required
      return true;
    });
    
    return () => backHandler.remove();
  }, [visible, forceUpdate]);

  const handleDownload = async () => {
    try {
      const supported = await Linking.canOpenURL(downloadUrl);
      if (supported) {
        await Linking.openURL(downloadUrl);
      } else {
        // Fallback to GitHub releases page
        await Linking.openURL('https://github.com/Banyel3/iayos/releases/latest');
      }
    } catch (error) {
      console.error('[UPDATE MODAL] Failed to open download URL:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={() => {
        if (!forceUpdate && onDismiss) {
          onDismiss();
        }
      }}
    >
      <View style={styles.container}>
        {/* App Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="download-outline" size={80} color={Colors.primary} />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {forceUpdate ? 'Update Required' : 'Update Available'}
        </Text>

        {/* Description */}
        <Text style={styles.description}>
          {forceUpdate
            ? 'A new version of iAyos is required to continue using the app. Please update to the latest version.'
            : 'A new version of iAyos is available. Update now to get the latest features and improvements.'}
        </Text>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>Current version:</Text>
            <Text style={styles.versionValue}>{installedVersion}</Text>
          </View>
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>Latest version:</Text>
            <Text style={[styles.versionValue, styles.newVersion]}>{currentVersion}</Text>
          </View>
        </View>

        {/* Download Button */}
        <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
          <Ionicons name="cloud-download-outline" size={24} color="#fff" />
          <Text style={styles.downloadButtonText}>Download Update</Text>
        </TouchableOpacity>

        {/* Later Button (only if not force update) */}
        {!forceUpdate && onDismiss && (
          <TouchableOpacity style={styles.laterButton} onPress={onDismiss}>
            <Text style={styles.laterButtonText}>Remind Me Later</Text>
          </TouchableOpacity>
        )}

        {/* Footer Note */}
        <Text style={styles.footerNote}>
          {Platform.OS === 'android'
            ? 'After downloading, open the APK file to install the update.'
            : 'You will be redirected to the download page.'}
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight || '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  versionContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 32,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  versionLabel: {
    fontSize: 14,
    color: '#666',
  },
  versionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  newVersion: {
    color: Colors.primary || '#2563eb',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary || '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    gap: 12,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  laterButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  laterButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  footerNote: {
    position: 'absolute',
    bottom: 32,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default UpdateRequiredModal;
