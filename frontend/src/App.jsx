import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

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

export default function App() {
  return (
    <>
      <Routes>
        {/* "/" always shows the login form, even if a session is already
            saved from a previous visit — the client wants one single login
            link that never silently skips straight to a dashboard. Once
            signed in, LoginPage itself navigates to /admin or /management
            based on the role the server returned. */}
        <Route path="/" element={<LoginPage />} />
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
