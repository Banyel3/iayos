import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL, apiRequest } from '@/lib/api/config';
import { getErrorMessage } from '@/lib/utils/parse-api-error';

export interface ContactSupportData {
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  attachment?: {
    uri: string;
    name: string;
    type: string;
  };
}

export interface ContactSupportResponse {
  success: boolean;
  ticketId: string;
  message: string;
}

export function useContactSupport() {
  return useMutation({
    mutationFn: async (data: ContactSupportData) => {
      const formData = new FormData();

      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('category', data.category);
      formData.append('subject', data.subject);
      formData.append('message', data.message);

      if (data.attachment) {
        formData.append('attachment', {
          uri: data.attachment.uri,
          name: data.attachment.name,
          type: data.attachment.type,
        } as any);
      }

      const response = await apiRequest(
        `${API_BASE_URL.replace('/api', '')}/api/support/contact`,
        {
          method: 'POST',
          headers: {
            // Don't set Content-Type, let browser set it with boundary
            Accept: 'application/json',
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(getErrorMessage(error, 'Failed to send support message'));
      }

      const result = await response.json();
      return result as ContactSupportResponse;
    },
  });
}
