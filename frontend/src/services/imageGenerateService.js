import api from './api';

export const imageGenerateService = {
    generateImage: async ({ prompt, style, version }) => {
        const res = await api.get('/images/generate', {
            params: { prompt, style, version }
        });
        return res.data.data;
    },

    getStyles: async () => {
        const res = await api.get('/images/styles');
        return res.data.data;
    },

    saveImage: async (imageData) => {
        const res = await api.post('/images/save', imageData);
        return res.data;
    },

    getSavedImages: async () => {
        const res = await api.get('/images/saved');
        return res.data.data;
    },

    deleteSavedImage: async (id) => {
        const res = await api.delete(`/images/saved/${id}`);
        return res.data;
    }
};
