import axiosClient from './axiosClient';

export const getTemplate = () => axiosClient.get('/settings/template').then((r) => r.data);
export const updateTemplate = (payload) => axiosClient.put('/settings/template', payload).then((r) => r.data);
