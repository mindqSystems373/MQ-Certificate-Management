import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-4">
      <p className="text-6xl font-bold text-brand-700">404</p>
      <p className="mt-2 text-slate-500">This page doesn't exist.</p>
      <Link to="/" className="mt-6 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
        Go home
      </Link>
    </div>
  );
}
