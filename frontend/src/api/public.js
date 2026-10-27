import axios from 'axios';

// Deliberately a separate, bare axios instance — this page has no login, so it
// must never pick up axiosClient's auth-store interceptor (nothing to attach,
// and a stray 401 there shouldn't ever trigger a panel logout).
const apiBase = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
const publicClient = axios.create({ baseURL: `${apiBase}/public` });

export const verifyCertificate = (number) => publicClient.get(`/certificates/${number}/verify`).then((r) => r.data);

export const certificateViewUrl = (number) => `${apiBase}/public/certificates/${number}/view`;
export const certificateDownloadUrl = (number) => `${apiBase}/public/certificates/${number}/download`;
