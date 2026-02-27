import api from './api';

export const chatService = {
  sendMessage: async (data) => {
    const res = await api.post('/chat/send', data);
    return res.data;
  },
  
  getSessions: async () => {
    const res = await api.get('/chat/sessions');
    return res.data.data;
  },
  
  getSessionMessages: async (sessionId) => {
    const res = await api.get(`/chat/sessions/${sessionId}`);
    return res.data.data;
  },
  
  createSession: async (data) => {
    const res = await api.post('/chat/sessions', data);
    return res.data.data;
  },
  
  deleteSession: async (sessionId) => {
    const res = await api.delete(`/chat/sessions/${sessionId}`);
    return res.data;
  },
  
  exportChat: async (sessionId) => {
    const res = await api.get(`/chat/sessions/${sessionId}/export`);
    return res.data.data;
  }
};