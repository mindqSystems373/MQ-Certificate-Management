import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, admin } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(admin?.role)) {
    const home = admin?.role === 'superadmin' ? '/admin' : '/management';
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
}
