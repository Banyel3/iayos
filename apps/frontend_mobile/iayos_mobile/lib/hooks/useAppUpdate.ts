/**
 * useAppUpdate - Hook for checking app version and prompting updates
 * 
 * Supports two update mechanisms:
 * 1. OTA (Over-The-Air) updates via expo-updates for JS bundle changes
 * 2. APK download with progress for native code changes
 * 
 * Fetches version info from /api/mobile/config on app startup and
 * compares against the installed app version (from Constants.expoConfig).
 */

import { useState, useEffect, useCallback } from 'react';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { Paths, File } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform, Alert } from 'react-native';
import { ENDPOINTS } from '@/lib/api/config';

export interface VersionInfo {
  min_version: string;
  current_version: string;
  force_update: boolean;
  download_url: string;
}

export interface DownloadProgress {
  isDownloading: boolean;
  progress: number; // 0-100
  bytesDownloaded: number;
  totalBytes: number;
  error: string | null;
}

export interface OTAUpdateState {
  isChecking: boolean;
  isAvailable: boolean;
  isDownloading: boolean;
  manifest: Updates.Manifest | null;
  error: string | null;
}

export interface AppUpdateState {
  isLoading: boolean;
  updateRequired: boolean;
  updateAvailable: boolean;
  forceUpdate: boolean;
  currentVersion: string;
  installedVersion: string;
  downloadUrl: string;
  error: string | null;
  // New: OTA update state
  ota: OTAUpdateState;
  // New: APK download state
  download: DownloadProgress;
}

/**
 * Compare two semantic version strings (e.g., "1.8.11" vs "1.8.10")
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  
  const maxLength = Math.max(partsA.length, partsB.length);
  
  for (let i = 0; i < maxLength; i++) {
    const partA = partsA[i] || 0;
    const partB = partsB[i] || 0;
    
    if (partA < partB) return -1;
    if (partA > partB) return 1;
  }
  
  return 0;
}

/**
 * Get the direct APK download URL from GitHub releases
 */
async function getDirectApkUrl(releaseUrl: string): Promise<string> {
  try {
    // If it's already a direct APK link, return it
    if (releaseUrl.endsWith('.apk')) {
      return releaseUrl;
    }
    
    // Convert GitHub releases page URL to API URL
    // https://github.com/Banyel3/iayos/releases/latest -> API call
    const apiUrl = releaseUrl.replace(
      'github.com/Banyel3/iayos/releases/latest',
      'api.github.com/repos/Banyel3/iayos/releases/latest'
    );
    
    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    
    if (!response.ok) {
      console.warn('[APP UPDATE] Failed to fetch GitHub release info');
      return releaseUrl;
    }
    
    const release = await response.json() as { assets?: Array<{ name?: string; content_type?: string; browser_download_url?: string }> };
    
    // Find the APK asset
    const apkAsset = release.assets?.find((asset) => 
      asset.name?.endsWith('.apk') || asset.content_type === 'application/vnd.android.package-archive'
    );
    
    if (apkAsset?.browser_download_url) {
      console.log('[APP UPDATE] Found direct APK URL:', apkAsset.browser_download_url);
      return apkAsset.browser_download_url;
    }
    
    return releaseUrl;
  } catch (error) {
    console.warn('[APP UPDATE] Error fetching direct APK URL:', error);
    return releaseUrl;
  }
}

export function useAppUpdate() {
  const [state, setState] = useState<AppUpdateState>({
    isLoading: true,
    updateRequired: false,
    updateAvailable: false,
    forceUpdate: false,
    currentVersion: '',
    installedVersion: '',
    downloadUrl: '',
    error: null,
    ota: {
      isChecking: false,
      isAvailable: false,
      isDownloading: false,
      manifest: null,
      error: null,
    },
    download: {
      isDownloading: false,
      progress: 0,
      bytesDownloaded: 0,
      totalBytes: 0,
      error: null,
    },
  });

  /**
   * Check for OTA (Over-The-Air) updates via expo-updates
   * These are JS bundle updates that don't require a new APK
   */
  const checkForOTAUpdate = useCallback(async (): Promise<boolean> => {
    // Skip OTA in development mode
    if (__DEV__ || !Updates.isEnabled) {
      console.log('[OTA UPDATE] Skipping - development mode or updates disabled');
      return false;
    }
    
    try {
      setState(prev => ({
        ...prev,
        ota: { ...prev.ota, isChecking: true, error: null }
      }));
      
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        console.log('[OTA UPDATE] Update available:', update.manifest);
        setState(prev => ({
          ...prev,
          ota: {
            isChecking: false,
            isAvailable: true,
            isDownloading: false,
            manifest: update.manifest ?? null,
            error: null,
          }
        }));
        return true;
      } else {
        console.log('[OTA UPDATE] No update available');
        setState(prev => ({
          ...prev,
          ota: { ...prev.ota, isChecking: false, isAvailable: false }
        }));
        return false;
      }
    } catch (error) {
      console.error('[OTA UPDATE] Check failed:', error);
      setState(prev => ({
        ...prev,
        ota: {
          ...prev.ota,
          isChecking: false,
          error: error instanceof Error ? error.message : 'OTA check failed',
        }
      }));
      return false;
    }
  }, []);

  /**
   * Download and apply OTA update
   * Will reload the app after successful update
   */
  const applyOTAUpdate = useCallback(async (): Promise<void> => {
    if (!Updates.isEnabled) {
      console.warn('[OTA UPDATE] Updates not enabled');
      return;
    }
    
    try {
      setState(prev => ({
        ...prev,
        ota: { ...prev.ota, isDownloading: true, error: null }
      }));
      
      console.log('[OTA UPDATE] Fetching update...');
      await Updates.fetchUpdateAsync();
      
      console.log('[OTA UPDATE] Update downloaded, reloading app...');
      await Updates.reloadAsync();
      
    } catch (error) {
      console.error('[OTA UPDATE] Failed to apply update:', error);
      setState(prev => ({
        ...prev,
        ota: {
          ...prev.ota,
          isDownloading: false,
          error: error instanceof Error ? error.message : 'Failed to apply update',
        }
      }));
    }
  }, []);

  /**
   * Download APK file with progress tracking
   * Returns the local file URI if successful
   */
  const downloadAPK = useCallback(async (url: string): Promise<string | null> => {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Supported', 'APK download is only available on Android');
      return null;
    }
    
    try {
      // Get direct APK URL from GitHub releases
      const directUrl = await getDirectApkUrl(url);
      
      setState(prev => ({
        ...prev,
        download: {
          isDownloading: true,
          progress: 0,
          bytesDownloaded: 0,
          totalBytes: 0,
          error: null,
        }
      }));
      
      console.log('[APK DOWNLOAD] Starting download from:', directUrl);
      
      const fileName = `iayos-update-${Date.now()}.apk`;
      const cacheDir = Paths.cache.uri;
      const fileUri = `${cacheDir}/${fileName}`;
      
      // Create download resumable with progress callback
      const downloadResumable = LegacyFileSystem.createDownloadResumable(
        directUrl,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesExpectedToWrite > 0
            ? Math.round((downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100)
            : 0;
          
          setState(prev => ({
            ...prev,
            download: {
              ...prev.download,
              progress,
              bytesDownloaded: downloadProgress.totalBytesWritten,
              totalBytes: downloadProgress.totalBytesExpectedToWrite,
            }
          }));
        }
      );
      
      const result = await downloadResumable.downloadAsync();
      
      if (result?.uri) {
        console.log('[APK DOWNLOAD] Download complete:', result.uri);
        setState(prev => ({
          ...prev,
          download: { ...prev.download, isDownloading: false, progress: 100 }
        }));
        return result.uri;
      } else {
        throw new Error('Download failed - no URI returned');
      }
      
    } catch (error) {
      console.error('[APK DOWNLOAD] Failed:', error);
      setState(prev => ({
        ...prev,
        download: {
          ...prev.download,
          isDownloading: false,
          error: error instanceof Error ? error.message : 'Download failed',
        }
      }));
      return null;
    }
  }, []);

  /**
   * Install APK using Android's package installer
   */
  const installAPK = useCallback(async (fileUri: string): Promise<void> => {
    if (Platform.OS !== 'android') {
      return;
    }
    
    try {
      console.log('[APK INSTALL] Launching installer for:', fileUri);
      
      // Get content URI for the file
      const contentUri = await LegacyFileSystem.getContentUriAsync(fileUri);
      
      // Launch Android's package installer
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        type: 'application/vnd.android.package-archive',
      });
      
      console.log('[APK INSTALL] Installer launched successfully');
      
    } catch (error) {
      console.error('[APK INSTALL] Failed to launch installer:', error);
      Alert.alert(
        'Installation Failed',
        'Could not open the APK installer. Please enable "Install from unknown sources" in your device settings and try again.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  /**
   * Download and install APK in one step
   */
  const downloadAndInstallAPK = useCallback(async (): Promise<void> => {
    const fileUri = await downloadAPK(state.downloadUrl);
    if (fileUri) {
      await installAPK(fileUri);
    }
  }, [state.downloadUrl, downloadAPK, installAPK]);

  /**
   * Check for version updates from backend
   */
  const checkForUpdates = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Get installed app version from Expo config
      const installedVersion = Constants.expoConfig?.version || '0.0.0';
      
      // Fetch config from backend
      const response = await fetch(ENDPOINTS.MOBILE_CONFIG, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`Config fetch failed: ${response.status}`);
      }
      
      const config = await response.json() as { version?: VersionInfo };
      const versionInfo: VersionInfo = config.version || {} as VersionInfo;
      
      const minVersion = versionInfo.min_version || '0.0.0';
      const currentVersion = versionInfo.current_version || '0.0.0';
      const forceUpdate = versionInfo.force_update ?? true;
      const downloadUrl = versionInfo.download_url || 'https://github.com/Banyel3/iayos/releases/latest';
      
      // Check if update is required (installed < min_version)
      const updateRequired = compareVersions(installedVersion, minVersion) < 0;
      
      // Check if update is available (installed < current_version)
      const updateAvailable = compareVersions(installedVersion, currentVersion) < 0;
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        updateRequired,
        updateAvailable,
        forceUpdate: updateRequired && forceUpdate,
        currentVersion,
        installedVersion,
        downloadUrl,
        error: null,
      }));
      
      if (updateRequired) {
        console.log(`[APP UPDATE] Update required: ${installedVersion} → ${minVersion}+ (force: ${forceUpdate})`);
      } else if (updateAvailable) {
        console.log(`[APP UPDATE] Update available: ${installedVersion} → ${currentVersion}`);
        // Check for OTA updates if a non-critical update is available
        await checkForOTAUpdate();
      } else {
        console.log(`[APP UPDATE] App is up to date: ${installedVersion}`);
        // Still check for OTA updates even if backend says we're current
        await checkForOTAUpdate();
      }
      
    } catch (error) {
      console.error('[APP UPDATE] Failed to check for updates:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check for updates',
      }));
    }
  }, [checkForOTAUpdate]);

  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  return {
    ...state,
    // Actions
    checkForUpdates,
    checkForOTAUpdate,
    applyOTAUpdate,
    downloadAPK,
    installAPK,
    downloadAndInstallAPK,
  };
}

export default useAppUpdate;
