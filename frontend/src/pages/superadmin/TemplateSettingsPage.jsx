import { useQuery } from '@tanstack/react-query';
import { getTemplate } from '../../api/settings';

// Every field on the current artwork (file-1.svg) — company name, seal,
// signature, and every ruled line — is baked into the image itself, so
// there's nothing left here to edit. This page is intentionally read-only;
// swapping the template image is a code change (see pdfService.js), not a
// setting, because the field coordinates are tightly coupled to whichever
// artwork is active.
export default function TemplateSettingsPage() {
  const templateQuery = useQuery({ queryKey: ['certificate-template'], queryFn: getTemplate });
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
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-10" />)}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-2">
          <p className="text-sm text-slate-600">
            Certificates are rendered directly onto Mind Q Systems&rsquo; official template artwork. Company name,
            seal, signature and every ruled line on the certificate are part of that image, so there&rsquo;s nothing
            to configure here — only the per-student fields (name, course, dates, grade) are filled in at generation
            time.
          </p>
          <p className="text-xs text-slate-400">Template file: {t?.templateImage}</p>
          <p className="text-xs text-slate-400">
            Certificates issued before a template change keep rendering exactly as issued — swapping the artwork
            only affects certificates generated afterward.
          </p>
        </div>
      )}
    </div>
  );
}
