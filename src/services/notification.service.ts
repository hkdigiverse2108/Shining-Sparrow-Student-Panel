import client from '../api/client';

export interface NotificationItem {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'achievement' | 'system' | 'workshop' | 'news';
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

const notificationService = {
  getAllNotifications: async (params?: { page?: number; limit?: number }) => {
    const response = await client.get('/notification/all', { params });
    return response.data;
  },

  markRead: async (id: string) => {
    const response = await client.post('/notification/read', { id });
    return response.data;
  },

  deleteNotification: async (id: string) => {
    const response = await client.post('/notification/delete', { id });
    return response.data;
  },
};

export default notificationService;
