import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { HiOutlineAcademicCap, HiOutlineSearch, HiArrowLeft } from 'react-icons/hi';
import { verifyCertificate, certificateViewUrl, certificateDownloadUrl } from '../../api/public';

// No auth, no DashboardLayout — this route is meant to be reached straight
// from the "Verification Link" in a student's certificate email (or by
// scanning the QR on the certificate itself), so it has to stand alone.
export default function VerificationPage() {
  const [searchParams] = useSearchParams();
  const [number, setNumber] = useState(searchParams.get('number') || '');
  const [showCertificate, setShowCertificate] = useState(false);

  const mutation = useMutation({
    mutationFn: verifyCertificate,
    onSuccess: () => setShowCertificate(false),
  });

  function onSubmit(e) {
    e.preventDefault();
    if (!number.trim()) return;
    mutation.mutate(number.trim());
  }

  const result = mutation.data?.data;

  if (showCertificate && result) {
    return <CertificatePreview number={result.certificateNumber} onBack={() => setShowCertificate(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-amber-200 bg-white shadow-sm p-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="rounded-full bg-brand-50 p-2 text-brand-600">
            <HiOutlineAcademicCap className="text-2xl" />
          </div>
          <h1 className="text-lg font-semibold text-slate-800">Mind Q Systems Student Certificate Verification Page</h1>
        </div>

        <div className="mt-4 text-sm text-slate-600 space-y-1">
          <p className="font-semibold text-slate-700">About Mind Q Systems</p>
          <p>
            Mind Q Systems is a training powerhouse offering trainings on varied IT Technologies such as Software
            Testing, QTP, Selenium, SQL Server DBA, MSBI, etc.
          </p>
          <p>Established in 2001 Mind Q Systems has successfully trained upwards of 100,000 persons &amp; has served well over 50 odd clients.</p>
        </div>

        <form onSubmit={onSubmit} className="mt-6">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Please enter Course completion Certificate number below: Ex: MQHYDxxxxxx
          </label>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Enter Your Certificate Number"
              value={number}
              onChange={(e) => setNumber(e.target.value.toUpperCase())}
            />
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              <HiOutlineSearch /> Check
            </button>
          </div>
        </form>

        {mutation.isError && (
          <p className="mt-4 text-sm text-red-600">
            {mutation.error.response?.data?.message || 'No certificate found for this number.'}
          </p>
        )}

        {result && (
          <div className="mt-6 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-slate-500 text-2xl shrink-0">
              🎓
            </div>
            <div className="flex-1 min-w-0">
              <button
                onClick={() => setShowCertificate(true)}
                className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
              >
                View Certificate
              </button>
              <p className="text-sm text-slate-500 truncate">{result.email}</p>
            </div>
            <p className="font-semibold text-slate-800 text-right">{result.fullName}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CertificatePreview({ number, onBack }) {
  return (
    <div className="min-h-screen bg-amber-50">
      <div className="bg-brand-900 text-amber-50 text-xs px-4 py-1.5 flex items-center gap-4">
        <button onClick={onBack} className="inline-flex items-center gap-1 hover:underline">
          <HiArrowLeft /> Home
        </button>
        <span>Telephone: 040-66664291/92</span>
        <span>Mobile: +91 9502901277</span>
      </div>
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <p className="font-semibold text-slate-800">MIND Q SYSTEMS</p>
        <p className="text-xs text-slate-400">QUALITY, TIME AND AGAIN</p>
      </div>
      <div className="bg-brand-600 text-white text-sm font-medium px-4 py-2">Mind Q Systems Course Completion Certificate</div>

      <div className="p-4 flex justify-center">
        <iframe
          title={`Certificate ${number}`}
          src={certificateViewUrl(number)}
          className="w-full max-w-3xl aspect-[210/297] rounded-lg border border-slate-300 bg-white shadow-sm"
        />
      </div>
      <p className="text-center text-xs text-slate-500 pb-6">
        This Course Completion Certificate is issued by Mind Q Systems.{' '}
        <a href={certificateDownloadUrl(number)} className="text-brand-600 hover:underline">
          Download PDF
        </a>
      </p>
    </div>
  );
}
