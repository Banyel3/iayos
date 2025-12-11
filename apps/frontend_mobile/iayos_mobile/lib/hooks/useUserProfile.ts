import { useQuery } from '@tanstack/react-query';
import { ENDPOINTS, apiRequest } from '@/lib/api/config';

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  profileType: 'WORKER' | 'CLIENT';
  profileImg?: string;
  contactNum?: string;
  isVerified: boolean;
  kycVerified: boolean;
  createdAt: string;
}

export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await apiRequest(ENDPOINTS.ME);

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      return data as UserProfile;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

export function useUserType() {
  const { data: profile } = useUserProfile();
  return profile?.profileType || 'WORKER'; // Default to WORKER
}
