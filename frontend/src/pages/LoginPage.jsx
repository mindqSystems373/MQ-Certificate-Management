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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-brand-900 px-4 py-10">
      {/* full-page world-map-style backdrop: dot grid + faint constellation lines + glow orbs */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]" preserveAspectRatio="none">
        <line x1="5%" y1="20%" x2="22%" y2="38%" stroke="white" strokeWidth="1" />
        <line x1="22%" y1="38%" x2="14%" y2="62%" stroke="white" strokeWidth="1" />
        <line x1="22%" y1="38%" x2="40%" y2="28%" stroke="white" strokeWidth="1" />
        <line x1="78%" y1="18%" x2="92%" y2="34%" stroke="white" strokeWidth="1" />
        <line x1="78%" y1="18%" x2="64%" y2="30%" stroke="white" strokeWidth="1" />
        <line x1="85%" y1="70%" x2="70%" y2="80%" stroke="white" strokeWidth="1" />
        <line x1="85%" y1="70%" x2="95%" y2="58%" stroke="white" strokeWidth="1" />
      </svg>
      <div
        className="pointer-events-none absolute -top-32 -right-32 h-[28rem] w-[28rem] rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--color-crimson-500), transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-20 h-[26rem] w-[26rem] rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--color-brand-400), transparent 70%)' }}
      />

      {/* floating card */}
      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10 flex flex-col md:flex-row bg-white">
        {/* Left panel — brand side */}
        <div className="relative md:w-[46%] overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 px-8 py-12 md:px-12 md:py-14 flex flex-col justify-center">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          <div
            className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full opacity-25 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--color-crimson-500), transparent 70%)' }}
          />

          <div className="relative z-10">
            <img
              src="/mindq-logo.png"
              alt="Mind Q Systems"
              className="h-20 md:h-24 w-auto mb-12 drop-shadow-[0_4px_14px_rgba(0,0,0,0.45)]"
            />
            <h1 className="text-3xl md:text-[2.25rem] font-bold text-white leading-tight">
              Welcome to<br />
              <span className="text-crimson-500">Mind Q Systems</span>
            </h1>
            <p className="mt-4 text-brand-200 text-base md:text-lg">
              Secure Certificate Management System
            </p>
            <div className="mt-10 h-1 w-20 rounded-full bg-crimson-500" />
          </div>
        </div>

        {/* Right panel — form side */}
        <div className="md:w-[54%] flex items-center justify-center px-8 py-12 md:px-14 md:py-14 bg-white">
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Access Your Account</h2>
            <p className="mt-1 text-sm text-slate-500">Sign in to continue to your dashboard</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-9 space-y-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Login ID</label>
                <div className="mt-2 flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 transition-colors focus-within:border-brand-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20">
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
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Password</label>
                <div className="mt-2 flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 transition-colors focus-within:border-brand-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20">
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
                className="w-full rounded-xl border-2 border-crimson-500 bg-brand-800 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-900/30 hover:bg-brand-700 transition-colors disabled:opacity-60"
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
    </div>
  );
}
