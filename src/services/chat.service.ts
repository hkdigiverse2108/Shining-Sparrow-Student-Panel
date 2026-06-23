import client from '../api/client';

export interface ChatRoom {
  _id: string;
  type: 'global' | 'personal';
  participants: Array<{ _id: string; fullName: string; role: string; profilePhoto?: string }>;
  createdBy?: string;
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface ChatMessage {
  _id: string;
  roomId: string;
  senderId: { _id: string; fullName: string; role: string; profilePhoto?: string } | string;
  message: string;
  attachment?: {
    url: string;
    type: 'image' | 'pdf' | 'doc';
    name: string;
  };
  createdAt: string;
}

const chatService = {
  getRooms: async () => {
    const response = await client.get('/chat/rooms');
    return response.data;
  },

  getMessages: async (roomId: string, params?: { page?: number; limit?: number }) => {
    const response = await client.get(`/chat/messages/${roomId}`, { params });
    return response.data;
  },

  createRoom: async (recipientId?: string) => {
    const response = await client.post('/chat/room/create', { recipientId });
    return response.data;
  },

  sendMessage: async (payload: { roomId?: string; message: string; attachment?: ChatMessage['attachment'] }) => {
    const response = await client.post('/chat/send', payload);
    return response.data;
  },
};

export default chatService;
