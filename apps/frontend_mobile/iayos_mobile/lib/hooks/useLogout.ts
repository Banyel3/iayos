import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ENDPOINTS, apiRequest } from '@/lib/api/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest(ENDPOINTS.LOGOUT, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }

      return response.json();
    },
    onSuccess: async () => {
      // Clear all React Query cache
      queryClient.clear();

      // Clear AsyncStorage (theme, language preferences, etc.)
      try {
        const keys = await AsyncStorage.getAllKeys();
        // Keep theme and language preferences if desired
        const keysToRemove = keys.filter(
          (key) => !key.includes('@iayos_theme') && !key.includes('@iayos_language')
        );
        if (keysToRemove.length > 0) {
          await AsyncStorage.multiRemove(keysToRemove);
        }
      } catch (error) {
        console.error('Failed to clear AsyncStorage:', error);
      }

      // Navigate to login screen
      router.replace('/auth/login' as any);
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear local data and navigate
      queryClient.clear();
      router.replace('/auth/login' as any);
    },
  });
}
