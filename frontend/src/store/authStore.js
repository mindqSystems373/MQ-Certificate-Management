import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Super Admin and Management are two independent panels sharing one domain
// (different paths, not different deployments). A single shared auth slot
// meant logging into one panel silently logged you out of the other — the
// browser's localStorage is per-origin, not per-path, so both panels were
// fighting over the same key. Each role now gets its own persisted store
// under its own localStorage key, so both sessions can be live in the same
// browser at once; visiting /admin never disturbs whatever is signed in at
// /management, and vice versa.
function createAuthStore(storageKey) {
  return create(
    persist(
      (set) => ({
        token: null,
        admin: null,
        isAuthenticated: false,
        login: (token, admin) => set({ token, admin, isAuthenticated: true }),
        logout: () => set({ token: null, admin: null, isAuthenticated: false }),
      }),
      { name: storageKey }
    )
  );
}

export const useSuperAdminAuthStore = createAuthStore('mindq-auth-superadmin');
export const useManagementAuthStore = createAuthStore('mindq-auth-management');

const storesByRole = {
  superadmin: useSuperAdminAuthStore,
  management: useManagementAuthStore,
};

export function storeForRole(role) {
  return storesByRole[role] || useSuperAdminAuthStore;
}

// For code outside React (axios interceptors) that can't call a hook: infers
// which panel is active from the URL, since that's the only signal available
// there. Defaults to the Super Admin store for any path that isn't under
// /management (covers /admin/*, /login, /).
export function storeForPath(pathname) {
  return pathname.startsWith('/management') ? useManagementAuthStore : useSuperAdminAuthStore;
}
