import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";

export interface InfoModalItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
}

interface InfoModalProps {
  visible: boolean;
  onClose: (dontShowAgain: boolean) => void;
  title: string;
  subtitle?: string;
  items: InfoModalItem[];
}

/**
 * InfoModal — one-time informational sheet with "Don't show again" option.
 *
 * Slides up from the bottom. Styled to match the app's CountdownConfirmModal
 * pattern but without a countdown — just informational content + dismiss.
 */
export default function InfoModal({
  visible,
  onClose,
  title,
  subtitle,
  items,
}: InfoModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    onClose(dontShowAgain);
    // Reset checkbox for any re-show (e.g. user didn't check "don't show"
    // so it will appear again and can be submitted fresh)
    setDontShowAgain(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.dragHandle} />
            <Text style={styles.title}>{title}</Text>
            {subtitle ? (
              <Text style={styles.subtitle}>{subtitle}</Text>
            ) : null}
          </View>

          {/* Items */}
          <ScrollView
            style={styles.itemsScroll}
            contentContainerStyle={styles.itemsContainer}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item, index) => (
              <View key={index} style={styles.item}>
                <View style={styles.iconWrapper}>
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={Colors.primary}
                  />
                </View>
                <View style={styles.itemText}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemDescription}>
                    {item.description}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            {/* Don't show again checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setDontShowAgain((prev) => !prev)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  dontShowAgain && styles.checkboxChecked,
                ]}
              >
                {dontShowAgain && (
                  <Ionicons name="checkmark" size={14} color={Colors.white} />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Don't show this again</Text>
            </TouchableOpacity>

            {/* Got it button */}
            <TouchableOpacity
              style={styles.gotItButton}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={styles.gotItText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "85%",
    ...Shadows.xl,
  },
  header: {
    alignItems: "center",
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.heading.h3,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  itemsScroll: {
    flexGrow: 0,
  },
  itemsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  itemText: {
    flex: 1,
  },
  itemLabel: {
    ...Typography.body.medium,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  itemDescription: {
    ...Typography.body.small,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    ...Typography.body.small,
    color: Colors.textSecondary,
  },
  gotItButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    ...Shadows.sm,
  },
  gotItText: {
    ...Typography.body.medium,
    fontWeight: "700",
    color: Colors.white,
  },
});
