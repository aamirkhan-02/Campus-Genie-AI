import api from './api';

export const dashboardService = {
  getStats: async () => {
    const res = await api.get('/dashboard/stats');
    return res.data.data;
  },
  
  getWeakAreas: async () => {
    const res = await api.get('/dashboard/weak-areas');
    return res.data.data;
  },
  
  updateTimeSpent: async (subject_name, seconds) => {
    return api.post('/dashboard/time', { subject_name, seconds });
  }
};