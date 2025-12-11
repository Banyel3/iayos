// components/ImageViewer.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  StatusBar,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import type { PortfolioImage } from "@/lib/hooks/usePortfolioManagement";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ImageViewerProps {
  visible: boolean;
  images: PortfolioImage[];
  initialIndex?: number;
  onClose: () => void;
  onEdit?: (image: PortfolioImage) => void;
  onDelete?: (image: PortfolioImage) => void;
  showActions?: boolean;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  visible,
  images,
  initialIndex = 0,
  onClose,
  onEdit,
  onDelete,
  showActions = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showMenu, setShowMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const currentImage = images[currentIndex];

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, images.length]);

  const handleEdit = useCallback(() => {
    setShowMenu(false);
    if (onEdit && currentImage) {
      onEdit(currentImage);
    }
  }, [onEdit, currentImage]);

  const handleDelete = useCallback(() => {
    setShowMenu(false);
    if (onDelete && currentImage) {
      onDelete(currentImage);
    }
  }, [onDelete, currentImage]);

  const toggleControls = useCallback(() => {
    setShowControls((prev) => !prev);
    if (showMenu) {
      setShowMenu(false);
    }
  }, [showMenu]);

  if (!visible || !currentImage) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar hidden={true} />
      <View style={styles.container}>
        {/* Header */}
        {showControls && (
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color={Colors.textLight} />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.indexText}>
                {currentIndex + 1} of {images.length}
              </Text>
            </View>

            {showActions && (
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setShowMenu(!showMenu)}
              >
                <Ionicons
                  name="ellipsis-vertical"
                  size={24}
                  color={Colors.textLight}
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Menu Dropdown */}
        {showMenu && showActions && (
          <View style={styles.menuDropdown}>
            {onEdit && (
              <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
                <Ionicons
                  name="pencil-outline"
                  size={20}
                  color={Colors.textPrimary}
                />
                <Text style={styles.menuText}>Edit Caption</Text>
              </TouchableOpacity>
            )}

            {onDelete && (
              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemDanger]}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={20} color={Colors.error} />
                <Text style={[styles.menuText, styles.menuTextDanger]}>
                  Delete Image
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Image Container */}
        <TouchableOpacity
          style={styles.imageContainer}
          activeOpacity={1}
          onPress={toggleControls}
        >
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(
                event.nativeEvent.contentOffset.x / SCREEN_WIDTH
              );
              setCurrentIndex(newIndex);
            }}
            contentOffset={{ x: currentIndex * SCREEN_WIDTH, y: 0 }}
          >
            {images.map((image, index) => (
              <View key={image.id} style={styles.imagePage}>
                <Image
                  source={{ uri: image.imageUrl }}
                  style={styles.image}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
        </TouchableOpacity>

        {/* Footer */}
        {showControls && (
          <View style={styles.footer}>
            {currentImage.caption && (
              <Text style={styles.caption}>{currentImage.caption}</Text>
            )}
            <Text style={styles.date}>
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
                <Ionicons
                  name="chevron-back"
                  size={32}
                  color={Colors.textLight}
                />
              </TouchableOpacity>
            )}

            {currentIndex < images.length - 1 && (
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonRight]}
                onPress={goToNext}
              >
                <Ionicons
                  name="chevron-forward"
                  size={32}
                  color={Colors.textLight}
                />
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
    backgroundColor: Colors.black,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 50 : Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  closeButton: {
    padding: Spacing.xs,
  },
  menuButton: {
    padding: Spacing.xs,
  },
  indexText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textLight,
  },
  menuDropdown: {
    position: "absolute",
    top: Platform.OS === "ios" ? 90 : 60,
    right: Spacing.md,
    zIndex: 11,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.medium,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 180,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemDanger: {
    borderBottomWidth: 0,
  },
  menuText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  menuTextDanger: {
    color: Colors.error,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  caption: {
    fontSize: Typography.fontSize.base,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
  date: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textHint,
  },
  navButton: {
    position: "absolute",
    top: "50%",
    zIndex: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonLeft: {
    left: Spacing.md,
  },
  navButtonRight: {
    right: Spacing.md,
  },
});
