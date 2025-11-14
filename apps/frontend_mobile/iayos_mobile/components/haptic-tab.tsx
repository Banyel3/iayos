// components/AvatarUpload.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useImagePicker } from '@/lib/hooks/useImagePicker';
import { useImageUpload } from '@/lib/hooks/useImageUpload';
import { ENDPOINTS } from '@/lib/api/config';
import { Colors, Typography, Spacing } from '@/constants/theme';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  size?: number;
  onUploadSuccess?: (avatarUrl: string) => void;
  onUploadError?: (error: string) => void;
  onDelete?: () => void;
  editable?: boolean;
  showEditOverlay?: boolean;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  size = 150,
  onUploadSuccess,
  onUploadError,
  onDelete,
  editable = true,
  showEditOverlay = true,
}) => {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const { pickFromGallery, takePhoto } = useImagePicker();
  const { upload, isUploading, progress } = useImageUpload();

  const displayUri = localUri || currentAvatarUrl;
  const hasAvatar = !!displayUri;

  const handleUpload = (uri: string) => {
    setLocalUri(uri);

    upload(
      {
        uri,
        endpoint: ENDPOINTS.UPLOAD_AVATAR,
        fieldName: 'avatar',
        compress: true,
      },
      {
        onSuccess: (result) => {
          if (result.success && result.data?.avatarUrl) {
            setLocalUri(null); // Clear local preview
            if (onUploadSuccess) {
              onUploadSuccess(result.data.avatarUrl);
            }
          } else {
            setLocalUri(null);
            const errorMsg = 'Upload failed. Please try again.';
            if (onUploadError) {
              onUploadError(errorMsg);
            }
            Alert.alert('Upload Failed', errorMsg);
          }
        },
        onError: (error) => {
          setLocalUri(null);
          const errorMsg = error instanceof Error ? error.message : 'Upload failed';
          if (onUploadError) {
            onUploadError(errorMsg);
          }
          Alert.alert('Upload Error', errorMsg);
        },
      }
    );
  };

  const handleChoosePhoto = () => {
    if (!editable) return;

    Alert.alert(
      'Upload Avatar',
      'Choose photo source',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const result = await takePhoto({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (result) {
              handleUpload(result.uri);
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const result = await pickFromGallery({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (result && !Array.isArray(result)) {
              handleUpload(result.uri);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleDeleteAvatar = () => {
    if (!editable || !hasAvatar) return;

    Alert.alert(
      'Remove Avatar',
      'Are you sure you want to remove your avatar?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setLocalUri(null);
            if (onDelete) {
              onDelete();
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.avatarContainer, { width: size, height: size }]}
        onPress={handleChoosePhoto}
        disabled={!editable || isUploading}
        activeOpacity={editable ? 0.7 : 1}
      >
        {hasAvatar ? (
          <Image
            source={{ uri: displayUri }}
            style={[styles.avatar, { width: size, height: size }]}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.placeholder,
              { width: size, height: size },
              isUploading && styles.placeholderUploading,
            ]}
          >
            <Ionicons
              name="person"
              size={size * 0.5}
              color={isUploading ? Colors.border : Colors.textSecondary}
            />
          </View>
        )}

        {isUploading && (
          <View style={[styles.uploadOverlay, { width: size, height: size }]}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.progressText}>{progress.percentage}%</Text>
          </View>
        )}

        {editable && showEditOverlay && !isUploading && (
          <View style={styles.editOverlay}>
            <Ionicons name="camera" size={24} color={Colors.textLight} />
          </View>
        )}
      </TouchableOpacity>

      {editable && hasAvatar && !isUploading && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAvatar}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    borderRadius: 9999, // Fully circular
    overflow: 'hidden',
    backgroundColor: Colors.background,
    borderWidth: 3,
    borderColor: Colors.border,
  },
  avatar: {
    borderRadius: 9999,
  },
  placeholder: {
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },
  placeholderUploading: {
    opacity: 0.5,
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },
  progressText: {
    color: Colors.textLight,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold as any,
    marginTop: Spacing.xs,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.error,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

import { Href, Link } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { type ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        if (process.env.EXPO_OS !== 'web') {
          // Prevent the default behavior of linking to the default browser on native.
          event.preventDefault();
          // Open the link in an in-app browser.
          await openBrowserAsync(href, {
            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
          });
        }
      }}
    />
  );
}

import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}

import Animated from 'react-native-reanimated';

export function HelloWave() {
  return (
    <Animated.Text
      style={{
        fontSize: 28,
        lineHeight: 32,
        marginTop: -6,
        animationName: {
          '50%': { transform: [{ rotate: '25deg' }] },
        },
        animationIterationCount: 4,
        animationDuration: '300ms',
      }}>
      👋
    </Animated.Text>
  );
}

// components/ImageViewer.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants/theme';
import type { PortfolioImage } from '@/lib/hooks/usePortfolioManagement';

interface ImageViewerProps {
  visible: boolean;
  images: PortfolioImage[];
  initialIndex?: number;
  onClose: () => void;
  onEdit?: (image: PortfolioImage) => void;
  onDelete?: (image: PortfolioImage) => void;
  editable?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ImageViewer: React.FC<ImageViewerProps> = ({
  visible,
  images,
  initialIndex = 0,
  onClose,
  onEdit,
  onDelete,
  editable = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showControls, setShowControls] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const currentImage = images[currentIndex];

  // Update current index when scrolling
  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < images.length) {
      setCurrentIndex(index);
    }
  };

  // Toggle controls visibility
  const toggleControls = () => {
    setShowControls(prev => !prev);
    setMenuVisible(false);
  };

  // Navigate to specific index
  const goToIndex = (index: number) => {
    if (scrollViewRef.current && index >= 0 && index < images.length) {
      scrollViewRef.current.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
      setCurrentIndex(index);
    }
  };

  // Navigate prev/next
  const goToPrevious = () => {
    if (currentIndex > 0) {
      goToIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      goToIndex(currentIndex + 1);
    }
  };

  // Handle edit
  const handleEdit = () => {
    setMenuVisible(false);
    if (onEdit && currentImage) {
      onEdit(currentImage);
      onClose();
    }
  };

  // Handle delete
  const handleDelete = () => {
    setMenuVisible(false);
    if (onDelete && currentImage) {
      Alert.alert(
        'Delete Image',
        'Are you sure you want to delete this image from your portfolio?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              onDelete(currentImage);
              
              // If this was the last image, close viewer
              if (images.length === 1) {
                onClose();
              } else if (currentIndex >= images.length - 1) {
                // If deleting last image, go to previous
                goToIndex(currentIndex - 1);
              }
            },
          },
        ]
      );
    }
  };

  // Format upload date
  const formatDate = (isoDate: string): string => {
    try {
      const date = new Date(isoDate);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    } catch {
      return '';
    }
  };

  if (!visible || images.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <View style={styles.container}>
        {/* Header */}
        {showControls && (
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={32} color={Colors.textLight} />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={styles.indexText}>
                {currentIndex + 1} of {images.length}
              </Text>
            </View>

            {editable && (
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setMenuVisible(!menuVisible)}
              >
                <Ionicons name="ellipsis-vertical" size={24} color={Colors.textLight} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Menu Dropdown */}
        {menuVisible && editable && (
          <View style={styles.menuDropdown}>
            {onEdit && (
              <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
                <Ionicons name="pencil" size={20} color={Colors.textPrimary} />
                <Text style={styles.menuText}>Edit Caption</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemDanger]}
                onPress={handleDelete}
              >
                <Ionicons name="trash" size={20} color={Colors.error} />
                <Text style={[styles.menuText, styles.menuTextDanger]}>Delete Image</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Image ScrollView */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentOffset={{ x: initialIndex * SCREEN_WIDTH, y: 0 }}
        >
          {images.map((image, index) => (
            <TouchableOpacity
              key={image.id}
              style={styles.imageContainer}
              activeOpacity={1}
              onPress={toggleControls}
            >
              <Image
                source={{ uri: image.imageUrl }}
                style={styles.image}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Footer */}
        {showControls && currentImage && (
          <View style={styles.footer}>
            {currentImage.caption && (
              <Text style={styles.caption}>{currentImage.caption}</Text>
            )}
            <Text style={styles.uploadDate}>
              Uploaded {formatDate(currentImage.uploadedAt)}
            </Text>
          </View>
        )}

        {/* Navigation Arrows */}
        {showControls && images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonLeft]}
                onPress={goToPrevious}
              >
                <Ionicons name="chevron-back" size={32} color={Colors.textLight} />
              </TouchableOpacity>
            )}
            {currentIndex < images.length - 1 && (
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonRight]}
                onPress={goToNext}
              >
                <Ionicons name="chevron-forward" size={32} color={Colors.textLight} />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  indexText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textLight,
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDropdown: {
    position: 'absolute',
    top: 60,
    right: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 11,
    minWidth: 180,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  menuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  menuText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  menuTextDanger: {
    color: Colors.error,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10,
  },
  caption: {
    fontSize: Typography.fontSize.md,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
  uploadDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  navButtonLeft: {
    left: Spacing.md,
  },
  navButtonRight: {
    right: Spacing.md,
  },
});

import type { PropsWithChildren, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

const HEADER_HEIGHT = 250;

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
}: Props) {
  const backgroundColor = useThemeColor({}, 'background');
  const colorScheme = useColorScheme() ?? 'light';
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(scrollOffset.value, [-HEADER_HEIGHT, 0, HEADER_HEIGHT], [2, 1, 1]),
        },
      ],
    };
  });

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={{ backgroundColor, flex: 1 }}
      scrollEventThrottle={16}>
      <Animated.View
        style={[
          styles.header,
          { backgroundColor: headerBackgroundColor[colorScheme] },
          headerAnimatedStyle,
        ]}>
        {headerImage}
      </Animated.View>
      <ThemedView style={styles.content}>{children}</ThemedView>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: 'hidden',
  },
});

// components/PortfolioGrid.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import type { PortfolioImage } from '@/lib/hooks/usePortfolioManagement';

interface PortfolioGridProps {
  images: PortfolioImage[];
  columns?: number;
  onImageTap?: (image: PortfolioImage, index: number) => void;
  onEdit?: (image: PortfolioImage) => void;
  onDelete?: (image: PortfolioImage) => void;
  onReorder?: (newOrder: number[]) => void;
  editable?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const PortfolioGrid: React.FC<PortfolioGridProps> = ({
  images,
  columns = 2,
  onImageTap,
  onEdit,
  onDelete,
  onReorder,
  editable = true,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const isReorderMode = selectedIds.size > 0;

  const spacing = Spacing.md;
  const imageSize = (SCREEN_WIDTH - spacing * (columns + 1)) / columns;

  const handleLongPress = (image: PortfolioImage) => {
    if (!editable) return;
    
    // Enter reorder mode
    Alert.alert(
      'Reorder Mode',
      'Select images to reorder, then drag to new positions.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Select',
          onPress: () => {
            setSelectedIds(new Set([image.id]));
          },
        },
      ]
    );
  };

  const handleImagePress = (image: PortfolioImage, index: number) => {
    if (isReorderMode) {
      // Toggle selection in reorder mode
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(image.id)) {
          newSet.delete(image.id);
        } else {
          newSet.add(image.id);
        }
        return newSet;
      });
    } else {
      // Normal tap - open viewer
      if (onImageTap) {
        onImageTap(image, index);
      }
    }
  };

  const handleEditPress = (image: PortfolioImage, e: any) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(image);
    }
  };

  const handleDeletePress = (image: PortfolioImage, e: any) => {
    e.stopPropagation();
    if (onDelete) {
      Alert.alert(
        'Delete Image',
        'Are you sure you want to delete this image from your portfolio?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => onDelete(image),
          },
        ]
      );
    }
  };

  const cancelReorderMode = () => {
    setSelectedIds(new Set());
  };

  const confirmReorder = () => {
    if (onReorder) {
      // Create new order: selected items first, then others
      const selected = images.filter(img => selectedIds.has(img.id));
      const unselected = images.filter(img => !selectedIds.has(img.id));
      const newOrder = [...selected, ...unselected].map(img => img.id);
      onReorder(newOrder);
    }
    setSelectedIds(new Set());
  };

  if (images.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="images-outline" size={64} color={Colors.textSecondary} />
        <Text style={styles.emptyText}>No portfolio images yet</Text>
        <Text style={styles.emptyHint}>Add work samples to showcase your skills</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Reorder Mode Header */}
      {isReorderMode && (
        <View style={styles.reorderHeader}>
          <TouchableOpacity onPress={cancelReorderMode}>
            <Text style={styles.reorderCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.reorderTitle}>
            {selectedIds.size} selected
          </Text>
          <TouchableOpacity onPress={confirmReorder}>
            <Text style={styles.reorderDone}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Grid */}
      <View style={styles.grid}>
        {images.map((image, index) => {
          const isSelected = selectedIds.has(image.id);
          
          return (
            <TouchableOpacity
              key={image.id}
              style={[
                styles.gridItem,
                { width: imageSize, height: imageSize },
                isSelected && styles.gridItemSelected,
              ]}
              onPress={() => handleImagePress(image, index)}
              onLongPress={() => handleLongPress(image)}
              delayLongPress={500}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: image.imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />

              {/* Selection Overlay */}
              {isSelected && (
                <View style={styles.selectionOverlay}>
                  <View style={styles.selectionBadge}>
                    <Ionicons name="checkmark" size={20} color={Colors.textLight} />
                  </View>
                </View>
              )}

              {/* Action Buttons (only in normal mode) */}
              {!isReorderMode && editable && (
                <View style={styles.actions}>
                  {onEdit && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={(e) => handleEditPress(image, e)}
                    >
                      <Ionicons name="pencil" size={16} color={Colors.textLight} />
                    </TouchableOpacity>
                  )}
                  {onDelete && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={(e) => handleDeletePress(image, e)}
                    >
                      <Ionicons name="trash" size={16} color={Colors.textLight} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Caption Preview */}
              {image.caption && !isReorderMode && (
                <View style={styles.captionOverlay}>
                  <Text style={styles.captionText} numberOfLines={2}>
                    {image.caption}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Reorder Hint */}
      {editable && !isReorderMode && images.length > 1 && (
        <Text style={styles.reorderHint}>
          Long press any image to reorder
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.xs,
  },
  gridItem: {
    margin: Spacing.xs,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gridItemSelected: {
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(33, 150, 243, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: BorderRadius.full,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: Spacing.xs,
  },
  captionText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textLight,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textSecondary,
  },
  emptyHint: {
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  reorderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryLight || '#E3F2FD',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  reorderCancel: {
    fontSize: Typography.fontSize.md,
    color: Colors.error,
    fontWeight: Typography.fontWeight.medium as any,
  },
  reorderTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
  },
  reorderDone: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.bold as any,
  },
  reorderHint: {
    textAlign: 'center',
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});

// components/PortfolioUpload.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useImagePicker } from '@/lib/hooks/useImagePicker';
import { useMultiImageUpload } from '@/lib/hooks/useImageUpload';
import { ENDPOINTS } from '@/lib/api/config';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { formatFileSize } from '@/lib/utils/image-utils';

interface UploadItem {
  id: string;
  uri: string;
  caption: string;
  progress: number;
  status: 'queued' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface PortfolioUploadProps {
  maxImages?: number;
  onUploadComplete?: () => void;
  disabled?: boolean;
}

export const PortfolioUpload: React.FC<PortfolioUploadProps> = ({
  maxImages = 10,
  onUploadComplete,
  disabled = false,
}) => {
  const { pickFromGallery } = useImagePicker();
  const { uploadMultiple, uploadingIndex, completedCount } = useMultiImageUpload();
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleSelectImages = async () => {
    if (disabled) return;

    const remainingSlots = maxImages - completedCount;
    if (remainingSlots <= 0) {
      Alert.alert('Limit Reached', `You can only upload up to ${maxImages} images.`);
      return;
    }

    const result = await pickFromGallery({
      allowsMultipleSelection: true,
      maxImages: Math.min(5, remainingSlots),
      quality: 0.8,
    });

    if (result && Array.isArray(result)) {
      const newItems: UploadItem[] = result.map((img, index) => ({
        id: `${Date.now()}_${index}`,
        uri: img.uri,
        caption: '',
        progress: 0,
        status: 'queued' as const,
      }));
      setUploadItems(newItems);
    }
  };

  const handleCaptionChange = (id: string, caption: string) => {
    setUploadItems(prev =>
      prev.map(item => (item.id === id ? { ...item, caption } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setUploadItems(prev => prev.filter(item => item.id !== id));
  };

  const handleStartUpload = async () => {
    if (uploadItems.length === 0) return;

    setIsUploading(true);

    const imagesToUpload = uploadItems.map(item => ({
      uri: item.uri,
      caption: item.caption || undefined,
    }));

    await uploadMultiple(
      imagesToUpload,
      ENDPOINTS.UPLOAD_PORTFOLIO_IMAGE,
      (index, progress) => {
        setUploadItems(prev =>
          prev.map((item, i) =>
            i === index
              ? { ...item, progress: progress.percentage, status: 'uploading' as const }
              : item
          )
        );
      },
      (results) => {
        setUploadItems(prev =>
          prev.map((item, i) =>
            results[i]?.success
              ? { ...item, status: 'success' as const, progress: 100 }
              : { ...item, status: 'error' as const, error: results[i]?.error }
          )
        );

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        setIsUploading(false);

        if (successCount > 0) {
          Alert.alert(
            'Upload Complete',
            `${successCount} image${successCount > 1 ? 's' : ''} uploaded successfully${
              failCount > 0 ? `, ${failCount} failed` : ''
            }.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  setUploadItems([]);
                  if (onUploadComplete) {
                    onUploadComplete();
                  }
                },
              },
            ]
          );
        } else {
          Alert.alert('Upload Failed', 'All uploads failed. Please try again.');
        }
      }
    );
  };

  const handleCancel = () => {
    Alert.alert('Cancel Upload', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: () => setUploadItems([]),
      },
    ]);
  };

  if (uploadItems.length === 0) {
    return (
      <TouchableOpacity
        style={[styles.addButton, disabled && styles.addButtonDisabled]}
        onPress={handleSelectImages}
        disabled={disabled}
      >
        <Ionicons
          name="add-circle"
          size={32}
          color={disabled ? Colors.textSecondary : Colors.primary}
        />
        <Text style={[styles.addButtonText, disabled && styles.addButtonTextDisabled]}>
          Add Portfolio Images
        </Text>
        <Text style={styles.addButtonHint}>
          {disabled
            ? `Limit reached (${maxImages}/${maxImages})`
            : 'Select up to 5 images at once'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {uploadItems.length} image{uploadItems.length > 1 ? 's' : ''} selected
        </Text>
        {!isUploading && (
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Upload Items */}
      <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
        {uploadItems.map((item, index) => (
          <View key={item.id} style={styles.uploadItem}>
            <Image source={{ uri: item.uri }} style={styles.thumbnail} />

            <View style={styles.itemDetails}>
              <TextInput
                style={styles.captionInput}
                placeholder="Add caption (optional)"
                value={item.caption}
                onChangeText={(text) => handleCaptionChange(item.id, text)}
                maxLength={200}
                editable={!isUploading}
                multiline
              />

              {item.status === 'uploading' && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[styles.progressFill, { width: `${item.progress}%` }]}
                    />
                  </View>
                  <Text style={styles.progressText}>{item.progress}%</Text>
                </View>
              )}

              {item.status === 'success' && (
                <View style={styles.statusContainer}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.successText}>Uploaded</Text>
                </View>
              )}

              {item.status === 'error' && (
                <View style={styles.statusContainer}>
                  <Ionicons name="close-circle" size={20} color={Colors.error} />
                  <Text style={styles.errorText}>Failed</Text>
                </View>
              )}
            </View>

            {!isUploading && item.status !== 'success' && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveItem(item.id)}
              >
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Upload Button */}
      {!isUploading && uploadItems.some(item => item.status !== 'success') && (
        <TouchableOpacity style={styles.uploadButton} onPress={handleStartUpload}>
          <Ionicons name="cloud-upload" size={24} color={Colors.textLight} />
          <Text style={styles.uploadButtonText}>Upload All</Text>
        </TouchableOpacity>
      )}

      {/* Uploading Status */}
      {isUploading && (
        <View style={styles.uploadingStatus}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.uploadingText}>
            Uploading {completedCount + 1} of {uploadItems.length}...
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight || '#E3F2FD',
  },
  addButtonDisabled: {
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  addButtonText: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.primary,
  },
  addButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  addButtonHint: {
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
  },
  cancelText: {
    fontSize: Typography.fontSize.md,
    color: Colors.error,
    fontWeight: Typography.fontWeight.medium as any,
  },
  itemsList: {
    maxHeight: 400,
  },
  uploadItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
  },
  itemDetails: {
    flex: 1,
    marginLeft: Spacing.sm,
    justifyContent: 'center',
  },
  captionInput: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
    minHeight: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    width: 40,
    textAlign: 'right',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  successText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.success,
    fontWeight: Typography.fontWeight.medium as any,
  },
  errorText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    fontWeight: Typography.fontWeight.medium as any,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  uploadButtonText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textLight,
  },
  uploadingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  uploadingText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
});

import React from "react";
import { TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useToggleSaveJob } from "@/lib/hooks/useSaveJob";

interface SaveButtonProps {
  jobId: number;
  isSaved: boolean;
  size?: number;
  style?: any;
  onToggle?: (isSaved: boolean) => void;
}

export function SaveButton({
  jobId,
  isSaved,
  size = 24,
  style,
  onToggle,
}: SaveButtonProps) {
  const { toggleSave, isLoading } = useToggleSaveJob({
    onSuccess: () => {
      onToggle?.(!isSaved);
    },
  });

  const handlePress = () => {
    toggleSave(jobId, isSaved);
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={Colors.error} />
      ) : (
        <Ionicons
          name={isSaved ? "heart" : "heart-outline"}
          size={size}
          color={Colors.error}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});

import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});

import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}

