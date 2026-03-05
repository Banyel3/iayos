import React, { useState } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import WorkerCalendarModal from "./WorkerCalendarModal";

export default function CalendarFAB() {
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const isWorker = user?.profile_data?.profileType === "WORKER";

  if (!isWorker) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 92 }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="calendar" size={24} color="#fff" />
      </TouchableOpacity>

      <WorkerCalendarModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 12,
    zIndex: 999,
  },
});
