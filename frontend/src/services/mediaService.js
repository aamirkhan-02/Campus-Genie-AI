import api from './api';

export const mediaService = {
  generateImage: async (prompt) => {
    const res = await api.post('/media/image', { prompt });
    return res.data.data;
  },
  
  generateVideo: async (prompt) => {
    const res = await api.post('/media/video', { prompt });
    return res.data.data;
  },
  
  textToSpeech: async (text) => {
    const res = await api.post('/media/tts', { text });
    return res.data.data;
  },
  
  getMedia: async () => {
    const res = await api.get('/media');
    return res.data.data;
  }
};