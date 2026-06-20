import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import notificationService from '../services/notification.service';

export const useNotifications = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationService.getAllNotifications(params),
    refetchInterval: 30000, // automatically poll every 30 seconds
  });
};

export const useMarkReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useDeleteNotificationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
