import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { HiOutlineSave } from 'react-icons/hi';
import { getTemplate, updateTemplate } from '../../api/settings';

export default function TemplateSettingsPage() {
  const queryClient = useQueryClient();
  const templateQuery = useQuery({ queryKey: ['certificate-template'], queryFn: getTemplate });

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    const t = templateQuery.data?.data;
    if (t) reset({ verifyUrl: t.verifyUrl });
  }, [templateQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (values) => updateTemplate({ verifyUrl: values.verifyUrl }),
    onSuccess: ({ data }) => {
      toast.success(`Template updated to ${data.version}`);
      queryClient.invalidateQueries({ queryKey: ['certificate-template'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update template'),
  });

  const t = templateQuery.data?.data;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-800">Certificate Template</h2>
        {t?.version && (
          <span className="text-xs font-medium text-brand-700 bg-brand-50 rounded-full px-3 py-1">
            Active version: {t.version}
          </span>
        )}
      </div>

      {templateQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-10" />)}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-600 mb-3">
              Certificates are generated on Mind Q Systems&rsquo; official template artwork. Company name, seal,
              signature and footer address are part of that image — the only thing you can adjust here is where the
              QR verification code points.
            </p>
            <p className="text-xs text-slate-400">Template file: {t?.templateImage}</p>
          </div>

          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Verification URL (encoded in each certificate's QR code)</span>
              <input className="input mt-1" {...register('verifyUrl')} />
            </label>

            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              <HiOutlineSave /> {mutation.isPending ? 'Saving…' : 'Save (bumps version)'}
            </button>
            <p className="text-xs text-slate-400">
              Saving creates a new template version. Certificates already issued keep the version they were generated under.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}
