// components/PortfolioGrid.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import type { PortfolioImage } from "@/lib/hooks/usePortfolioManagement";

interface PortfolioGridProps {
  images: PortfolioImage[];
  onImageTap?: (image: PortfolioImage, index: number) => void;
  onEdit?: (image: PortfolioImage) => void;
  onDelete?: (image: PortfolioImage) => void;
  onReorder?: (imageIds: number[]) => void;
  editable?: boolean;
}

export const PortfolioGrid: React.FC<PortfolioGridProps> = ({
  images,
  onImageTap,
  onEdit,
  onDelete,
  onReorder,
  editable = false,
}) => {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const toggleSelection = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);

    if (newSet.size === 0) {
      setSelectionMode(false);
    }
  };

  const handleLongPress = (image: PortfolioImage) => {
    if (!editable) return;
    setSelectionMode(true);
    setSelectedIds(new Set([image.id]));
  };

  const handleReorder = () => {
    if (selectedIds.size !== 2) {
      Alert.alert(
        "Reorder",
        "Please select exactly 2 images to swap positions."
      );
      return;
    }

    const selectedArray = Array.from(selectedIds);
    const idx1 = images.findIndex((img) => img.id === selectedArray[0]);
    const idx2 = images.findIndex((img) => img.id === selectedArray[1]);

    if (idx1 === -1 || idx2 === -1) return;

    Alert.alert(
      "Reorder Images",
      `Swap positions of image ${idx1 + 1} and image ${idx2 + 1}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Swap",
          onPress: () => {
            const newOrder = [...images];
            [newOrder[idx1], newOrder[idx2]] = [newOrder[idx2], newOrder[idx1]];
            if (onReorder) {
              onReorder(newOrder.map((img) => img.id));
            }
            setSelectionMode(false);
            setSelectedIds(new Set());
          },
        },
      ]
    );
  };

  const handleDelete = (image: PortfolioImage) => {
    Alert.alert(
      "Delete Image",
      "Are you sure you want to delete this portfolio image?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (onDelete) {
              onDelete(image);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: PortfolioImage;
    index: number;
  }) => {
    const isSelected = selectedIds.has(item.id);

    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => {
          if (selectionMode) {
            toggleSelection(item.id);
          } else if (onImageTap) {
            onImageTap(item, index);
          }
        }}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />

          {selectionMode && (
            <View
              style={[
                styles.selectionOverlay,
                isSelected && styles.selectedOverlay,
              ]}
            >
              {isSelected && (
                <View style={styles.checkmark}>
                  <Ionicons
                    name="checkmark"
                    size={24}
                    color={Colors.textLight}
                  />
                </View>
              )}
            </View>
          )}

          {!selectionMode && editable && (
            <View style={styles.actionOverlay}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  if (onEdit) {
                    onEdit(item);
                  }
                }}
              >
                <Ionicons name="pencil" size={16} color={Colors.textLight} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item)}
              >
                <Ionicons name="trash" size={16} color={Colors.textLight} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {item.caption && !selectionMode && (
          <Text style={styles.caption} numberOfLines={2} ellipsizeMode="tail">
            {item.caption}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (images.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="images-outline"
          size={48}
          color={Colors.textSecondary}
        />
        <Text style={styles.emptyText}>No portfolio images yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {selectionMode && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>{selectedIds.size} selected</Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity
              style={styles.selectionButton}
              onPress={handleReorder}
              disabled={selectedIds.size !== 2}
            >
              <Ionicons
                name="swap-horizontal"
                size={20}
                color={
                  selectedIds.size === 2 ? Colors.primary : Colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.selectionButtonText,
                  selectedIds.size === 2 && styles.selectionButtonTextActive,
                ]}
              >
                Reorder
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.selectionButton}
              onPress={() => {
                setSelectionMode(false);
                setSelectedIds(new Set());
              }}
            >
              <Text style={styles.selectionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={images}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gridContent: {
    paddingBottom: Spacing.md,
  },
  row: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  gridItem: {
    flex: 1,
    maxWidth: "48%",
  },
  imageWrapper: {
    aspectRatio: 1,
    borderRadius: BorderRadius.medium,
    overflow: "hidden",
    backgroundColor: Colors.backgroundSecondary,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  actionOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: Spacing.xs,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(189, 0, 0, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectionOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedOverlay: {
    backgroundColor: "rgba(84, 183, 236, 0.5)",
  },
  checkmark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  caption: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 16,
  },
  selectionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.md,
  },
  selectionText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
  },
  selectionActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  selectionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  selectionButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  selectionButtonTextActive: {
    color: Colors.primary,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
});
