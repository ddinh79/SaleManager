import api from './api';

const notificationService = {
  getNotifications: async (page = 1, pageSize = 20, unreadOnly = false) => {
    const response = await api.get('/notifications', {
      params: { page, pageSize, unreadOnly }
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: string) => {
    await api.post(`/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    await api.post('/notifications/read-all');
  },

  getSettings: async () => {
    const response = await api.get('/notifications/settings');
    return response.data;
  },

  updateSettings: async (data: {
    followUpReminderEnabled: boolean;
    dealClosingEnabled: boolean;
    inactiveAlertEnabled: boolean;
  }) => {
    const response = await api.post('/notifications/settings', data);
    return response.data;
  },
};

export default notificationService;