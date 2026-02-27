import api from './api';

export const youtubeService = {
  getLanguages: async () => {
    const res = await api.get('/youtube/languages');
    return res.data.data;
  },

  searchVideos: async ({ query, subject, language, maxResults, order, duration }) => {
    const res = await api.get('/youtube/search', {
      params: { query, subject, language, maxResults, order, duration }
    });
    return res.data.data;
  },

  getRecommended: async (subject, language) => {
    const res = await api.get(`/youtube/recommended/${encodeURIComponent(subject)}`, {
      params: { language }
    });
    return res.data.data;
  },

  getTopicVideos: async (subject, topic, language) => {
    const res = await api.get('/youtube/topic', {
      params: { subject, topic, language }
    });
    return res.data.data;
  },

  saveVideo: async (videoData) => {
    const res = await api.post('/youtube/save', videoData);
    return res.data;
  },

  getSavedVideos: async () => {
    const res = await api.get('/youtube/saved');
    return res.data.data;
  },

  deleteSavedVideo: async (id) => {
    const res = await api.delete(`/youtube/saved/${id}`);
    return res.data;
  }
};