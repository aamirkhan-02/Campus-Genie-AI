import api from './api';

export const notificationService = {
    getAll: async () => {
        const res = await api.get('/notifications');
        return res.data.data;
    },

    getUnreadCount: async () => {
        const res = await api.get('/notifications/unread-count');
        return res.data.data.count;
    },

    markAsRead: async (id) => {
        await api.put(`/notifications/${id}/read`);
    },

    markAllAsRead: async () => {
        await api.put('/notifications/read-all');
    },

    delete: async (id) => {
        await api.delete(`/notifications/${id}`);
    }
};
