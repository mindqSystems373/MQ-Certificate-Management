import { motion } from 'framer-motion';

export default function StatCard({ label, value, icon: Icon, accent = 'brand', loading }) {
  const accentClasses = {
    brand: 'bg-brand-50 text-brand-700',
    gold: 'bg-gold-500/10 text-gold-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon && (
          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-lg ${accentClasses[accent]}`}>
            <Icon />
          </span>
        )}
      </div>
      {loading ? (
        <div className="skeleton h-8 w-20 mt-3" />
      ) : (
        <p className="mt-2 text-3xl font-bold text-slate-800">{value}</p>
      )}
    </motion.div>
  );
}
