import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Persisted to localStorage so a page refresh doesn't drop the session — the
// PRD's "Remember Me" just controls how long the JWT itself is valid
// (JWT_EXPIRES_IN vs JWT_REMEMBER_EXPIRES_IN on the backend); this store just
// holds whatever token the server issued.
export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      admin: null,
      isAuthenticated: false,
      login: (token, admin) => set({ token, admin, isAuthenticated: true }),
      logout: () => set({ token: null, admin: null, isAuthenticated: false }),
    }),
    { name: 'mindq-auth' }
  )
);
