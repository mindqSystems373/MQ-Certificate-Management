import { motion } from 'framer-motion';

// Deliberately no AnimatePresence/exit animation here: AnimatePresence defers
// unmounting until the exit transition's onExitComplete fires, and in testing
// that never resolved reliably (the modal was still visible via computer),
// leaving an invisible `position:fixed; inset:0` node that keeps swallowing
// every click on the page. An entrance-only animation removes the failure
// mode entirely — closing is an instant, guaranteed unmount.
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', onConfirm, onCancel, loading }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onCancel}>
      <motion.div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
