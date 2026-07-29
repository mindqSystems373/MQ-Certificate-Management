import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Local dev proxies /api to the backend (see vite.config.js), so a relative
// path works there. In production the frontend and backend are two separate
// Vercel projects with different domains, so VITE_API_URL (baked in at build
// time via .env.production) points at the deployed backend's own /api.
const apiBase = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

const axiosClient = axios.create({
  baseURL: apiBase,
});

axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A 401 here always means the token is gone/expired/invalid (auth middleware
// already re-checks the account on every request) — so this is the one place
// that needs to force a logout, instead of every page handling it individually.
axiosClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
