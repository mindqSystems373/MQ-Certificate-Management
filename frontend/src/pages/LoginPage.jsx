import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left panel — brand side */}
      <div className="relative md:w-1/2 overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 px-8 py-12 md:px-16 md:py-0 flex flex-col justify-center">
        {/* subtle world-map-style dot texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-crimson-500), transparent 70%)' }}
        />

        <div className="relative z-10 max-w-md">
          <img
            src="/mindq-logo.png"
            alt="Mind Q Systems"
            className="h-16 md:h-20 w-auto mb-10 drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]"
          />
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            Welcome to <span className="text-crimson-500">Mind Q Systems</span>
          </h1>
          <p className="mt-4 text-brand-200 text-base md:text-lg">
            Secure Certificate Management System
          </p>
          <div className="mt-10 h-1 w-20 rounded-full bg-crimson-500" />
        </div>
      </div>

      {/* Right panel — form side */}
      <div className="md:w-1/2 flex items-center justify-center px-6 py-14 md:py-0">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Access Your Account</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to continue to your dashboard</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700">Login ID</label>
              <div className="mt-1.5 flex items-center rounded-xl border border-slate-300 bg-slate-50 px-3.5 transition-colors focus-within:border-brand-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20">
                <HiOutlineMail className="text-slate-400 shrink-0" size={18} />
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="admin@mindq"
                  className="w-full border-0 bg-transparent px-2.5 py-3 text-sm text-slate-900 outline-none"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-crimson-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1.5 flex items-center rounded-xl border border-slate-300 bg-slate-50 px-3.5 transition-colors focus-within:border-brand-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20">
                <HiOutlineLockClosed className="text-slate-400 shrink-0" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full border-0 bg-transparent px-2.5 py-3 text-sm text-slate-900 outline-none"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-slate-400 hover:text-slate-600 shrink-0"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-crimson-600">{errors.password.message}</p>}
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600 select-none">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                {...register('rememberMe')}
              />
              Remember me
            </label>

            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="w-full rounded-xl bg-crimson-600 py-3 text-sm font-semibold text-white shadow-lg shadow-crimson-600/20 hover:bg-crimson-700 transition-colors disabled:opacity-60"
            >
              {mutation.isPending ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-10 text-center text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Mind Q Systems (P) Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
