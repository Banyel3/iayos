/**
 * useAppUpdate - Hook for checking app version and prompting updates
 * 
 * Fetches version info from /api/mobile/config on app startup and
 * compares against the installed app version (from Constants.expoConfig).
 * 
 * Returns update status that can be used to show a blocking modal.
 */

import { useState, useEffect, useCallback } from 'react';
import Constants from 'expo-constants';
import { ENDPOINTS } from '@/lib/api/config';

export interface VersionInfo {
  min_version: string;
  current_version: string;
  force_update: boolean;
  download_url: string;
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

export function useAppUpdate(): AppUpdateState {
  const [state, setState] = useState<AppUpdateState>({
    isLoading: true,
    updateRequired: false,
    updateAvailable: false,
    forceUpdate: false,
    currentVersion: '',
    installedVersion: '',
    downloadUrl: '',
    error: null,
  });

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
      
      setState({
        isLoading: false,
        updateRequired,
        updateAvailable,
        forceUpdate: updateRequired && forceUpdate,
        currentVersion,
        installedVersion,
        downloadUrl,
        error: null,
      });
      
      if (updateRequired) {
        console.log(`[APP UPDATE] Update required: ${installedVersion} → ${minVersion}+ (force: ${forceUpdate})`);
      } else if (updateAvailable) {
        console.log(`[APP UPDATE] Update available: ${installedVersion} → ${currentVersion}`);
      } else {
        console.log(`[APP UPDATE] App is up to date: ${installedVersion}`);
      }
      
    } catch (error) {
      console.error('[APP UPDATE] Failed to check for updates:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check for updates',
      }));
    }
  }, []);

  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  return state;
}

export default useAppUpdate;
