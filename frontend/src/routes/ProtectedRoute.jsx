import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { storeForRole } from '../store/authStore';

// Each route group is guarded by exactly one role, and that role has its own
// independent session store (see store/authStore.js) — so unlike a typical
// single-session app, being signed out of /admin says nothing about whether
// /management is also signed out. This never redirects to the OTHER panel's
// dashboard on auth failure; it only ever sends you to /login, preserving
// whatever session that other panel already has.
export default function ProtectedRoute({ role }) {
  const { isAuthenticated } = storeForRole(role)();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
