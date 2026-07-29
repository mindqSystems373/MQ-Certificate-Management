import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { HiOutlineSearch, HiOutlineDownload, HiOutlineEye, HiOutlineX } from 'react-icons/hi';
import { getCertificateByNumber, downloadCertificate } from '../../api/certificates';
import axiosClient from '../../api/axiosClient';

export default function ViewCertificatePage() {
  const [number, setNumber] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const searchMutation = useMutation({
    mutationFn: () => getCertificateByNumber(number.trim()),
    onSuccess: ({ data }) => setCertificate(data),
    onError: (err) => {
      setCertificate(null);
      toast.error(err.response?.data?.message || 'Certificate not found');
    },
  });

  async function handlePreview() {
    try {
      const res = await axiosClient.get(`/certificates/${certificate.certificateNumber}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      setPreviewUrl(url);
    } catch {
      toast.error('Could not load certificate preview');
    }
  }

  function closePreview() {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }

  return (
    <div className="max-w-3xl">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Mind Q Systems Student Certification Report</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (number.trim()) searchMutation.mutate();
          }}
          className="flex items-end gap-3"
        >
          <label className="flex-1">
            <span className="text-sm font-medium text-slate-700">Enter Your Receipt Number</span>
            <input
              className="input mt-1"
              placeholder="e.g. MQHYD000001"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </label>
          <button type="submit" disabled={searchMutation.isPending} className="btn-primary shrink-0">
            <HiOutlineSearch /> Search
          </button>
        </form>

        {certificate && (
          <div className="mt-6 rounded-lg border border-slate-200 p-5">
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <Row label="Name" value={certificate.student?.fullName} />
              <Row label="Email" value={certificate.student?.email} />
              <Row label="Course" value={certificate.course?.name} />
              <Row label="Faculty" value={certificate.faculty?.name} />
              <Row label="Grade" value={certificate.grade?.label} />
              <Row label="Certificate No." value={certificate.certificateNumber} />
              <Row label="Issue Date" value={new Date(certificate.issueDate).toLocaleDateString()} />
              <Row label="Status" value={certificate.status} capitalize />
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={handlePreview} className="btn-secondary">
                <HiOutlineEye /> View Certificate
              </button>
              <button onClick={() => downloadCertificate(certificate.certificateNumber)} className="btn-primary">
                <HiOutlineDownload /> Download
              </button>
            </div>
          </div>
        )}
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
    </div>
  );
}

function Row({ label, value, capitalize }) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd className={`font-medium text-slate-800 ${capitalize ? 'capitalize' : ''}`}>{value || '—'}</dd>
    </>
  );
}
