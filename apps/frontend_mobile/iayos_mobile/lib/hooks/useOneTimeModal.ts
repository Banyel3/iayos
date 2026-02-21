import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * useOneTimeModal
 *
 * Shows a modal once per device. After the user dismisses it with
 * "Don't show again" checked, the preference is persisted to AsyncStorage
 * and the modal never appears again.
 *
 * @param storageKey - Unique AsyncStorage key, e.g. "@iayos:hide_client_payment_info"
 * @returns { visible, dismiss }
 *   - visible: true means the modal should be shown NOW
 *   - dismiss(dontShowAgain): hide the modal; if true, persist suppression
 */
export function useOneTimeModal(storageKey: string) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(storageKey)
      .then((value) => {
        if (value !== "true") {
          setVisible(true);
        }
      })
      .catch(() => {
        // If AsyncStorage fails, default to showing the modal
        setVisible(true);
      });
  }, [storageKey]);

  const dismiss = (dontShowAgain: boolean) => {
    setVisible(false);
    if (dontShowAgain) {
      AsyncStorage.setItem(storageKey, "true").catch(() => {
        // Silent fail — worst case the modal shows again next time
      });
    }
  };

  return { visible, dismiss };
}
