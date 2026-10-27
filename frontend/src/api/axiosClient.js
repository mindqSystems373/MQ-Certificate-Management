import axios from 'axios';
import { storeForPath } from '../store/authStore';

// Local dev proxies /api to the backend (see vite.config.js), so a relative
// path works there. In production the frontend and backend are two separate
// Vercel projects with different domains, so VITE_API_URL (baked in at build
// time via .env.production) points at the deployed backend's own /api.
const apiBase = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

const axiosClient = axios.create({
  baseURL: apiBase,
});

// Both panels' API modules share this one axios instance, so the token has to
// be picked per-request from whichever panel's session is currently active —
// storeForPath reads that off the URL (see store/authStore.js for why this
// isn't just one global token).
axiosClient.interceptors.request.use((config) => {
  const token = storeForPath(window.location.pathname).getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A 401 here always means the token is gone/expired/invalid (auth middleware
// already re-checks the account on every request) — so this is the one place
// that needs to force a logout, instead of every page handling it individually.
// Only the panel that actually made the failing request gets logged out; the
// other panel's independent session is untouched.
axiosClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      storeForPath(window.location.pathname).getState().logout();
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
