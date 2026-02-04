/**
 * Camera Events - Simple event emitter for camera capture results
 *
 * Since Expo Router doesn't support returning values from navigated screens,
 * we use a simple event-based system to communicate captured photo URIs
 * from the camera screen back to the calling screen.
 */

type CaptureCallback = (uri: string) => void;
type DocumentType = "front" | "back" | "clearance" | "selfie";

class CameraEventEmitter {
  private listeners: Map<DocumentType, CaptureCallback[]> = new Map();

  /**
   * Subscribe to capture events for a specific document type
   */
  on(documentType: DocumentType, callback: CaptureCallback): () => void {
    const existing = this.listeners.get(documentType) || [];
    this.listeners.set(documentType, [...existing, callback]);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(documentType) || [];
      this.listeners.set(
        documentType,
        callbacks.filter((cb) => cb !== callback),
      );
    };
  }

  /**
   * Emit a capture event with the photo URI
   */
  emit(documentType: DocumentType, uri: string): void {
    const callbacks = this.listeners.get(documentType) || [];
    callbacks.forEach((callback) => {
      try {
        callback(uri);
      } catch (error) {
        console.error("[CameraEvents] Callback error:", error);
      }
    });
  }

  /**
   * Clear all listeners for a specific document type
   */
  clear(documentType: DocumentType): void {
    this.listeners.delete(documentType);
  }

  /**
   * Clear all listeners
   */
  clearAll(): void {
    this.listeners.clear();
  }
}

// Singleton instance
export const cameraEvents = new CameraEventEmitter();
