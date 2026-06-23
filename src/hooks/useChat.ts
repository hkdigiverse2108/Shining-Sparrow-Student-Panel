import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import chatService from '../services/chat.service';

export const useChatRooms = () => {
  return useQuery({
    queryKey: ['chat-rooms'],
    queryFn: () => chatService.getRooms(),
    refetchInterval: 10000,
  });
};

export const useChatMessages = (roomId: string | null) => {
  return useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: () => chatService.getMessages(roomId!, { page: 1, limit: 50 }),
    enabled: !!roomId,
  });
};

export const useCreateChatRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recipientId?: string) => chatService.createRoom(recipientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    },
  });
};

export const useSendChatMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { roomId?: string; message: string }) => chatService.sendMessage(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
      if (variables.roomId) {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.roomId] });
      }
    },
  });
};
