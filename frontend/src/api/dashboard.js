import axiosClient from './axiosClient';

export const getDashboardSummary = () => axiosClient.get('/dashboard/summary').then((r) => r.data);
export const getLatestCertificates = (limit = 5) =>
  axiosClient.get('/dashboard/latest-certificates', { params: { limit } }).then((r) => r.data);
export const getRecentActivity = (limit = 10) =>
  axiosClient.get('/dashboard/recent-activity', { params: { limit } }).then((r) => r.data);
