import api from './api';

export const mcqService = {
  getSubjectsWithTopics: async () => {
    const res = await api.get('/mcq/subjects');
    return res.data.data;
  },

  getTopics: async (subject) => {
    const res = await api.get(`/mcq/topics/${encodeURIComponent(subject)}`);
    return res.data.data;
  },

  generateQuiz: async (data) => {
    const res = await api.post('/mcq/generate', data);
    return res.data.data;
  },

  submitAnswer: async (data) => {
    const res = await api.post('/mcq/answer', data);
    return res.data.data;
  },

  completeQuiz: async (sessionId) => {
    const res = await api.post(`/mcq/complete/${sessionId}`);
    return res.data.data;
  },

  getHistory: async (params = {}) => {
    const res = await api.get('/mcq/history', { params });
    return res.data.data;
  },

  getPerformance: async () => {
    const res = await api.get('/mcq/performance');
    return res.data.data;
  },

  bookmarkQuestion: async (sessionId, questionNumber) => {
    const res = await api.post('/mcq/bookmark', { sessionId, questionNumber });
    return res.data;
  },

  getBookmarks: async (subject) => {
    const res = await api.get('/mcq/bookmarks', { params: { subject } });
    return res.data.data;
  }
};