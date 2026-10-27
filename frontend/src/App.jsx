import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import { useSuperAdminAuthStore, useManagementAuthStore } from './store/authStore';

import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import VerificationPage from './pages/public/VerificationPage';

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
  // Both panels can be signed in at once now (independent sessions — see
  // store/authStore.js), so "/" has to pick one rather than reading a single
  // shared login state. Super Admin wins when both are active; there's no
  // "more correct" choice here, it's just a starting point either way.
  const superAdmin = useSuperAdminAuthStore((s) => s.isAuthenticated);
  const management = useManagementAuthStore((s) => s.isAuthenticated);
  if (superAdmin) return <Navigate to="/admin" replace />;
  if (management) return <Navigate to="/management" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verification" element={<VerificationPage />} />

        <Route element={<ProtectedRoute role="superadmin" />}>
          <Route element={<DashboardLayout title="Super Admin Panel" role="superadmin" />}>
            <Route path="/admin" element={<SuperAdminDashboard />} />
            <Route path="/admin/students/new" element={<AddStudentPage />} />
            <Route path="/admin/certificates/view" element={<ViewCertificatePage />} />
            <Route path="/admin/courses" element={<CoursesPage />} />
            <Route path="/admin/faculties" element={<FacultiesPage />} />
            <Route path="/admin/grades" element={<GradesPage />} />
            <Route path="/admin/template" element={<TemplateSettingsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute role="management" />}>
          <Route element={<DashboardLayout title="Management Panel" role="management" />}>
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
