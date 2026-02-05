/**
 * UpdateRequiredModal - Blocking modal for required app updates
 * 
 * Shows a full-screen modal when the app version is below minimum required.
 * Non-dismissible when force_update is true.
 * 
 * Features:
 * - OTA (Over-The-Air) updates for JS bundle changes
 * - In-app APK download with progress bar
 * - Automatic APK installer launch
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { DownloadProgress, OTAUpdateState } from '@/lib/hooks/useAppUpdate';

interface UpdateRequiredModalProps {
  visible: boolean;
  installedVersion: string;
  currentVersion: string;
  downloadUrl: string;
  forceUpdate: boolean;
  onDismiss?: () => void;
  // New props for enhanced update
  ota: OTAUpdateState;
  download: DownloadProgress;
  onApplyOTA: () => Promise<void>;
  onDownloadAPK: () => Promise<void>;
  onInstallAPK?: () => Promise<void>;
}

/**
 * Format bytes to human-readable string (e.g., "12.5 MB")
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function UpdateRequiredModal({
  visible,
  installedVersion,
  currentVersion,
  downloadUrl,
  forceUpdate,
  onDismiss,
  ota,
  download,
  onApplyOTA,
  onDownloadAPK,
  onInstallAPK,
}: UpdateRequiredModalProps) {
  
  const downloadComplete = !!download.localUri;
  
  // Block Android back button when force update is required
  useEffect(() => {
    if (!visible || !forceUpdate) return;
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Prevent back navigation when force update is required
      return true;
    });
    
    return () => backHandler.remove();
  }, [visible, forceUpdate]);

  const handleUpdate = async () => {
    if (download.localUri) {
      await (onInstallAPK ? onInstallAPK() : onDownloadAPK());
      return;
    }
    // Prefer OTA update if available (faster, no APK download)
    if (ota.isAvailable) {
      await onApplyOTA();
    } else {
      // Fall back to APK download
      await onDownloadAPK();
    }
  };

  const isProcessing =
    ota.isDownloading ||
    download.isDownloading ||
    ota.isChecking ||
    download.isInstalling;
  
  // Determine button text based on state
  const getButtonContent = () => {
    if (ota.isChecking) {
      return (
        <>
          <ActivityIndicator color="#fff" size="small" />
          <Text style={styles.downloadButtonText}>Checking for Updates...</Text>
        </>
      );
    }
    
    if (ota.isDownloading) {
      return (
        <>
          <ActivityIndicator color="#fff" size="small" />
          <Text style={styles.downloadButtonText}>Applying Update...</Text>
        </>
      );
    }
    
    if (download.isDownloading) {
      return (
        <>
          <ActivityIndicator color="#fff" size="small" />
          <Text style={styles.downloadButtonText}>Downloading... {download.progress}%</Text>
        </>
      );
    }
    
    if (downloadComplete) {
      return (
        <>
          <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
          <Text style={styles.downloadButtonText}>
            {download.isInstalling ? 'Installing...' : 'Install Update'}
          </Text>
        </>
      );
    }
    
    if (ota.isAvailable) {
      return (
        <>
          <Ionicons name="flash-outline" size={24} color="#fff" />
          <Text style={styles.downloadButtonText}>Apply Update</Text>
        </>
      );
    }
    
    return (
      <>
        <Ionicons name="cloud-download-outline" size={24} color="#fff" />
        <Text style={styles.downloadButtonText}>Download Update</Text>
      </>
    );
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
          {download.isDownloading ? (
            <View style={styles.progressCircle}>
              <Text style={styles.progressText}>{download.progress}%</Text>
            </View>
          ) : (
            <Ionicons 
              name={ota.isAvailable ? "flash" : "download-outline"} 
              size={80} 
              color={Colors.primary} 
            />
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {forceUpdate ? 'Update Required' : 'Update Available'}
        </Text>

        {/* Description */}
        <Text style={styles.description}>
          {download.isDownloading
            ? 'Downloading the latest version of iAyos. Please wait...'
            : ota.isAvailable
              ? 'A quick update is ready to apply. This will only take a moment.'
              : forceUpdate
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
          
          {/* Download Progress */}
          {download.isDownloading && (
            <>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${download.progress}%` }]} />
              </View>
              <View style={styles.versionRow}>
                <Text style={styles.versionLabel}>Downloaded:</Text>
                <Text style={styles.versionValue}>
                  {formatBytes(download.bytesDownloaded)} / {formatBytes(download.totalBytes)}
                </Text>
              </View>
            </>
          )}
          
          {/* OTA Badge */}
          {ota.isAvailable && !download.isDownloading && (
            <View style={styles.otaBadge}>
              <Ionicons name="flash" size={16} color={Colors.success || '#22c55e'} />
              <Text style={styles.otaBadgeText}>Instant Update Available</Text>
            </View>
          )}
        </View>

        {/* Error Message */}
        {(download.error || ota.error) && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={20} color="#ef4444" />
            <Text style={styles.errorText}>{download.error || download.installError || ota.error}</Text>
          </View>
        )}

        {/* Download Button */}
        <TouchableOpacity 
          style={[styles.downloadButton, isProcessing && styles.downloadButtonDisabled]} 
          onPress={handleUpdate}
          disabled={isProcessing}
        >
          {getButtonContent()}
        </TouchableOpacity>

        {/* Later Button (only if not force update) */}
        {!forceUpdate && onDismiss && !isProcessing && (
          <TouchableOpacity style={styles.laterButton} onPress={onDismiss}>
            <Text style={styles.laterButtonText}>Remind Me Later</Text>
          </TouchableOpacity>
        )}

        {/* Footer Note */}
        <Text style={styles.footerNote}>
          {ota.isAvailable
            ? 'This is an instant update. No download required.'
            : Platform.OS === 'android'
              ? 'The update will download and install automatically.'
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
  progressCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: Colors.primary || '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary || '#2563eb',
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
    marginBottom: 24,
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
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginTop: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary || '#2563eb',
    borderRadius: 4,
  },
  otaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dcfce7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  otaBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success || '#22c55e',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
    width: '100%',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    flex: 1,
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
  downloadButtonDisabled: {
    backgroundColor: Colors.primary ? `${Colors.primary}99` : '#2563eb99',
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
