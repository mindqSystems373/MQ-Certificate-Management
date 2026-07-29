import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import { useAuthStore } from './store/authStore';

import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';

import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import AddStudentPage from './pages/superadmin/AddStudentPage';
import ViewCertificatePage from './pages/superadmin/ViewCertificatePage';
import CoursesPage from './pages/superadmin/CoursesPage';
import FacultiesPage from './pages/superadmin/FacultiesPage';
import GradesPage from './pages/superadmin/GradesPage';
import TemplateSettingsPage from './pages/superadmin/TemplateSettingsPage';

import ManagementDashboard from './pages/management/ManagementDashboard';
import StudentsListPage from './pages/management/StudentsListPage';
import SearchPage from './pages/management/SearchPage';

function HomeRedirect() {
  const { isAuthenticated, admin } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={admin?.role === 'superadmin' ? '/admin' : '/management'} replace />;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
          <Route element={<DashboardLayout title="Super Admin Panel" />}>
            <Route path="/admin" element={<SuperAdminDashboard />} />
            <Route path="/admin/students/new" element={<AddStudentPage />} />
            <Route path="/admin/certificates/view" element={<ViewCertificatePage />} />
            <Route path="/admin/courses" element={<CoursesPage />} />
            <Route path="/admin/faculties" element={<FacultiesPage />} />
            <Route path="/admin/grades" element={<GradesPage />} />
            <Route path="/admin/template" element={<TemplateSettingsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['management']} />}>
          <Route element={<DashboardLayout title="Management Panel" />}>
            <Route path="/management" element={<ManagementDashboard />} />
            <Route path="/management/students" element={<StudentsListPage />} />
            <Route path="/management/search" element={<SearchPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <ToastContainer position="top-right" autoClose={3000} newestOnTop />
    </>
  );
}
