/**
 * SuggestionBubbles - Reusable horizontal chip/bubble component
 *
 * Displays a row of tappable suggestion chips that can be used for
 * auto-filling form fields. Shows a subtle loading state when fetching.
 *
 * Used in job creation for title, description, materials, and duration suggestions.
 */

import React from "react";
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";

export interface SuggestionItem {
  text: string;
  frequency?: number;
}

interface SuggestionBubblesProps {
  suggestions: SuggestionItem[];
  onSelect: (text: string) => void;
  isLoading?: boolean;
  /** Label shown before chips, e.g. "Suggestions" or "Common materials" */
  label?: string;
  /** Icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
  /** If true, shows a small "DB" badge on items from the database (frequency > 0) */
  showFrequency?: boolean;
}

export default function SuggestionBubbles({
  suggestions,
  onSelect,
  isLoading = false,
  label,
  icon = "sparkles-outline",
  showFrequency = false,
}: SuggestionBubblesProps) {
  if (!isLoading && suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {(label || isLoading) && (
        <View style={styles.header}>
          {label && (
            <View style={styles.labelRow}>
              <Ionicons name={icon} size={12} color={Colors.primary} />
              <Text style={styles.label}>{label}</Text>
            </View>
          )}
          {isLoading && (
            <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
          )}
        </View>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {suggestions.map((item, index) => (
          <TouchableOpacity
            key={`${item.text}-${index}`}
            style={styles.chip}
            onPress={() => onSelect(item.text)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipText} numberOfLines={1}>
              {item.text}
            </Text>
            {showFrequency && item.frequency != null && item.frequency > 0 && (
              <View style={styles.freqBadge}>
                <Text style={styles.freqText}>{item.frequency}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  loader: {
    marginLeft: 8,
  },
  scroll: {
    // same as existing suggestionScroll
  },
  content: {
    paddingRight: 16,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.primary + "10",
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  chipText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "500",
    maxWidth: 200,
  },
  freqBadge: {
    marginLeft: 6,
    backgroundColor: Colors.primary + "20",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  freqText: {
    fontSize: 9,
    color: Colors.primary,
    fontWeight: "700",
  },
});
