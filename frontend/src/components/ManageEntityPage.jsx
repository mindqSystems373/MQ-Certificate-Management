import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { HiOutlinePlus, HiOutlineBan, HiOutlineCheck } from 'react-icons/hi';
import TableSkeleton from './TableSkeleton';
import ConfirmDialog from './ConfirmDialog';

/**
 * Courses, Faculties and Grades all share the same UI shape (add form + list
 * with a deactivate toggle) — mirrors crudFactory.js on the backend. One
 * generic page avoids three near-identical React components; each caller just
 * supplies its queryKey, api, and field/column definitions.
 */
export default function ManageEntityPage({ title, queryKey, api, fields, columns, nameKey }) {
  const queryClient = useQueryClient();
  const [pendingDeactivate, setPendingDeactivate] = useState(null);

  const listQuery = useQuery({ queryKey: [queryKey], queryFn: () => api.list() });
  const { register, handleSubmit, reset } = useForm();

  const createMutation = useMutation({
    mutationFn: api.create,
    onSuccess: () => {
      toast.success(`${title} added`);
      reset();
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (err) => toast.error(err.response?.data?.message || `Failed to add ${title.toLowerCase()}`),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => api.deactivate(id),
    onSuccess: () => {
      toast.success(`${title} deactivated`);
      setPendingDeactivate(null);
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to deactivate'),
  });

  const items = listQuery.data?.data || [];

  return (
    <div className="max-w-4xl space-y-6">
      <form
        onSubmit={handleSubmit((values) => createMutation.mutate(values))}
        className="rounded-xl border border-slate-200 bg-white p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <h2 className="sm:col-span-2 text-base font-semibold text-slate-800">Add {title}</h2>
        {fields.map((f) => (
          <label key={f.name} className="block">
            <span className="text-sm font-medium text-slate-700">{f.label}</span>
            <input
              type={f.type || 'text'}
              className="input mt-1"
              {...register(f.name, { required: f.required })}
            />
          </label>
        ))}
        <div className="sm:col-span-2">
          <button type="submit" disabled={createMutation.isPending} className="btn-primary">
            <HiOutlinePlus /> {createMutation.isPending ? 'Adding…' : `Add ${title}`}
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">{title} List</h2>
        {listQuery.isLoading ? (
          <TableSkeleton rows={4} cols={columns.length + 1} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  {columns.map((c) => <th key={c.key} className="py-2 pr-4 font-medium">{c.label}</th>)}
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-b border-slate-100 last:border-0">
                    {columns.map((c) => <td key={c.key} className="py-2.5 pr-4">{item[c.key] ?? '—'}</td>)}
                    <td className="py-2.5 pr-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      {item.isActive && (
                        <button
                          onClick={() => setPendingDeactivate(item)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          <HiOutlineBan /> Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td colSpan={columns.length + 2} className="py-6 text-center text-slate-400">
                      No {title.toLowerCase()}s yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDeactivate)}
        title={`Deactivate ${title.toLowerCase()}?`}
        message={`"${pendingDeactivate?.[nameKey]}" will be hidden from future student/certificate forms. Existing records are unaffected.`}
        confirmLabel={<span className="inline-flex items-center gap-1"><HiOutlineCheck /> Deactivate</span>}
        loading={deactivateMutation.isPending}
        onCancel={() => setPendingDeactivate(null)}
        onConfirm={() => deactivateMutation.mutate(pendingDeactivate._id)}
      />
    </div>
  );
}
