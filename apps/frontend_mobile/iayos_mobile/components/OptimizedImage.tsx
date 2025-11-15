import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  ActivityIndicator,
  StyleSheet,
  ImageProps,
  ImageStyle,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface OptimizedImageProps {
  source: { uri: string } | number;
  style?: ImageStyle;
  placeholder?: string;
  blurhash?: string;
  lazy?: boolean;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized image component with lazy loading, placeholders, and error handling
 */
export default function OptimizedImage({
  source,
  style,
  placeholder = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
  blurhash,
  lazy = true,
  fallbackIcon = 'image-outline',
  resizeMode = 'cover',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(!lazy);

  useEffect(() => {
    if (lazy) {
      // Simulate intersection observer for lazy loading
      // In production, use react-native-intersection-observer or similar
      const timer = setTimeout(() => {
        setShouldLoad(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [lazy]);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
    onLoad?.();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    onError?.();
  };

  const imageUri = typeof source === 'object' ? source.uri : undefined;
  const isLocalSource = typeof source === 'number';

  // Show placeholder while not loaded yet (lazy loading)
  if (!shouldLoad && lazy) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.placeholderContainer}>
          <Ionicons name="image-outline" size={32} color="#D1D5DB" />
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Ionicons name={fallbackIcon} size={32} color="#9CA3AF" />
        </View>
      </View>
    );
  }

  // Use expo-image for better performance
  return (
    <View style={[styles.container, style]}>
      <ExpoImage
        source={source}
        style={[StyleSheet.absoluteFill, style]}
        placeholder={blurhash || placeholder}
        contentFit={resizeMode}
        transition={200}
        onLoad={handleLoad}
        onError={handleError}
      />
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  placeholderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});
