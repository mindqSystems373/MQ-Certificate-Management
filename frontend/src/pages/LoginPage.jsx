import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';
import { login as loginApi } from '../api/auth';
import { storeForRole } from '../store/authStore';

// Login ID is an internal identifier (e.g. "admin@mindq"), not necessarily a
// full RFC-valid email — matches the backend's relaxed check in authRoutes.js.
const schema = z.object({
  email: z.string().min(1, 'Login ID is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { rememberMe: false } });

  const mutation = useMutation({
    mutationFn: loginApi,
    onSuccess: ({ data }) => {
      // Written into the store matching the ROLE THE SERVER RETURNED, not
      // whichever panel the login form happened to be reached from — that's
      // what lets both panels carry independent, simultaneous sessions (see
      // store/authStore.js).
      storeForRole(data.admin.role).getState().login(data.token, data.admin);
      toast.success(`Welcome, ${data.admin.name}`);
      const fallback = data.admin.role === 'superadmin' ? '/admin' : '/management';
      navigate(location.state?.from?.pathname || fallback, { replace: true });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Login failed');
    },
  });

  const onSubmit = (values) => mutation.mutate(values);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="bg-brand-800 px-8 py-6 text-center">
          <p className="text-white text-xl font-bold tracking-wide">Mind Q Systems</p>
          <p className="text-brand-200 text-sm mt-1">Certificate Management System</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-8 space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-700">Login ID</label>
            <div className="mt-1 flex items-center rounded-lg border border-slate-300 px-3 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
              <HiOutlineMail className="text-slate-400" />
              <input
                type="text"
                autoComplete="username"
                placeholder="admin@mindq"
                className="w-full border-0 bg-transparent px-2 py-2.5 text-sm outline-none"
                {...register('email')}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <div className="mt-1 flex items-center rounded-lg border border-slate-300 px-3 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
              <HiOutlineLockClosed className="text-slate-400" />
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full border-0 bg-transparent px-2 py-2.5 text-sm outline-none"
                {...register('password')}
              />
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" className="rounded border-slate-300" {...register('rememberMe')} />
            Remember me
          </label>

          <button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-60"
          >
            {mutation.isPending ? 'Signing in…' : 'Sign In'}
          </button>

          <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500 space-y-1">
            <p className="font-medium text-slate-600">Demo credentials</p>
            <p>Super Admin: admin@mindq / mindq@admin</p>
            <p>Management: management@mindq / mindq@management</p>
          </div>
        </form>
      </div>
    </div>
  );
}
