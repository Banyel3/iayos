// lib/hooks/useImagePicker.ts
import * as ImagePicker from 'expo-image-picker';
import { useCallback } from 'react';
import { Alert } from 'react-native';

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
  type?: string;
  fileName?: string | null;
  fileSize?: number;
}

export interface ImagePickerOptions {
  allowsMultipleSelection?: boolean;
  maxImages?: number;
  quality?: number; // 0-1
  allowsEditing?: boolean;
  aspect?: [number, number];
}

export const useImagePicker = () => {
  /**
   * Pick image(s) from gallery
   */
  const pickFromGallery = useCallback(async (
    options?: ImagePickerOptions
  ): Promise<PickedImage | PickedImage[] | null> => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload images.',
          [{ text: 'OK' }]
        );
        return null;
      }

      // Launch picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: options?.allowsMultipleSelection ?? false,
        selectionLimit: options?.maxImages ?? 1,
        quality: options?.quality ?? 0.8,
        allowsEditing: options?.allowsEditing ?? !options?.allowsMultipleSelection,
        aspect: options?.aspect,
      });

      if (result.canceled) {
        return null;
      }

      // Format results
      if (options?.allowsMultipleSelection) {
        return result.assets.map(asset => ({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: asset.type,
          fileName: asset.fileName,
          fileSize: asset.fileSize,
        }));
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type,
        fileName: asset.fileName,
        fileSize: asset.fileSize,
      };
    } catch (error) {
      console.error('Gallery picker error:', error);
      Alert.alert('Error', 'Failed to open gallery. Please try again.');
      return null;
    }
  }, []);

  /**
   * Take photo with camera
   */
  const takePhoto = useCallback(async (
    options?: Omit<ImagePickerOptions, 'allowsMultipleSelection' | 'maxImages'>
  ): Promise<PickedImage | null> => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your camera to take photos.',
          [{ text: 'OK' }]
        );
        return null;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options?.allowsEditing ?? true,
        aspect: options?.aspect,
        quality: options?.quality ?? 0.8,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: asset.type,
        fileName: asset.fileName,
        fileSize: asset.fileSize,
      };
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
      return null;
    }
  }, []);

  /**
   * Check gallery permission status
   */
  const checkGalleryPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
    return status === 'granted';
  }, []);

  /**
   * Check camera permission status
   */
  const checkCameraPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    return status === 'granted';
  }, []);

  return {
    pickFromGallery,
    takePhoto,
    checkGalleryPermission,
    checkCameraPermission,
  };
};
