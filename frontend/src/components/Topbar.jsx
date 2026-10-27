import { useNavigate } from 'react-router-dom';
import { HiOutlineLogout } from 'react-icons/hi';
import { toast } from 'react-toastify';
import { storeForRole } from '../store/authStore';
import { logout as logoutApi } from '../api/auth';

export default function Topbar({ title, role }) {
  const navigate = useNavigate();
  const { admin, logout } = storeForRole(role)();

  async function handleLogout() {
    try {
      await logoutApi();
    } catch {
      // Token may already be invalid/expired — logging out locally still succeeds.
    }
    logout();
    toast.info('You have been logged out');
    navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur px-4 md:px-8 py-4">
      <div>
        <h1 className="text-lg md:text-xl font-semibold text-brand-800">{title}</h1>
        <p className="text-xs text-slate-500">Welcome back, {admin?.name}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 capitalize">
          {admin?.role}
        </span>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <HiOutlineLogout />
          Logout
        </button>
      </div>
    </header>
  );
}
