import axiosClient from './axiosClient';

export const login = (payload) => axiosClient.post('/auth/login', payload).then((r) => r.data);
export const me = () => axiosClient.get('/auth/me').then((r) => r.data);
export const logout = () => axiosClient.post('/auth/logout').then((r) => r.data);
