import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { HiOutlineEye, HiOutlineDownload, HiOutlineMail, HiOutlineX } from 'react-icons/hi';
import { downloadCertificate, resendCertificate } from '../api/certificates';
import axiosClient from '../api/axiosClient';
import ConfirmDialog from './ConfirmDialog';

// Shared View / Download / Resend actions used by both the Management student
// table and the search results table, so preview + resend behavior (and the
// confirmation dialog) stay identical in both places.
export default function CertificateActions({ certificateNumber, disabled }) {
  const queryClient = useQueryClient();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [confirmResend, setConfirmResend] = useState(false);

  const resendMutation = useMutation({
    mutationFn: () => resendCertificate(certificateNumber),
    onSuccess: ({ data }) => {
      toast.success(data.simulated ? `Resend simulated to ${data.to} (no SMTP configured)` : `Certificate emailed to ${data.to}`);
      setConfirmResend(false);
      queryClient.invalidateQueries({ queryKey: ['certificate-search'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to resend certificate'),
  });

  async function handlePreview() {
    try {
      const res = await axiosClient.get(`/certificates/${certificateNumber}/download`, { responseType: 'blob' });
      setPreviewUrl(window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' })));
    } catch {
      toast.error('Could not load certificate preview');
    }
  }

  function closePreview() {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }

  if (disabled) return <span className="text-xs text-slate-400">Pending</span>;

  return (
    <>
      <div className="flex items-center gap-3">
        <button title="View" onClick={handlePreview} className="text-slate-500 hover:text-brand-700">
          <HiOutlineEye />
        </button>
        <button title="Download" onClick={() => downloadCertificate(certificateNumber)} className="text-slate-500 hover:text-brand-700">
          <HiOutlineDownload />
        </button>
        <button title="Resend" onClick={() => setConfirmResend(true)} className="text-slate-500 hover:text-brand-700">
          <HiOutlineMail />
        </button>
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={closePreview}>
          <div className="relative w-full max-w-4xl h-[85vh] bg-white rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button onClick={closePreview} className="absolute top-3 right-3 z-10 rounded-full bg-white/90 p-1.5 shadow">
              <HiOutlineX className="text-lg" />
            </button>
            <iframe src={previewUrl} title="Certificate preview" className="w-full h-full" />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmResend}
        title="Resend certificate?"
        message={`This will email certificate ${certificateNumber} to the student on record.`}
        confirmLabel="Resend"
        loading={resendMutation.isPending}
        onCancel={() => setConfirmResend(false)}
        onConfirm={() => resendMutation.mutate()}
      />
    </>
  );
}
