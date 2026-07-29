import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { HiOutlineDocumentText, HiOutlineBadgeCheck, HiOutlineClock, HiOutlineCalendar } from 'react-icons/hi';
import { getDashboardSummary, getLatestCertificates } from '../../api/dashboard';
import StatCard from '../../components/StatCard';

export default function ManagementDashboard() {
  const summaryQuery = useQuery({ queryKey: ['dashboard-summary'], queryFn: getDashboardSummary });
  const latestQuery = useQuery({ queryKey: ['latest-certificates'], queryFn: () => getLatestCertificates(6) });
  const s = summaryQuery.data?.data;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Records" value={s?.totalRecords ?? '—'} icon={HiOutlineDocumentText} loading={summaryQuery.isLoading} />
        <StatCard label="Issued Records" value={s?.issuedRecords ?? '—'} icon={HiOutlineBadgeCheck} accent="emerald" loading={summaryQuery.isLoading} />
        <StatCard label="Pending Records" value={s?.pendingRecords ?? '—'} icon={HiOutlineClock} accent="amber" loading={summaryQuery.isLoading} />
        <StatCard label="Issued This Month" value={s?.certificatesThisMonth ?? '—'} icon={HiOutlineCalendar} accent="gold" loading={summaryQuery.isLoading} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 text-sm">
        <p className="text-slate-700">
          View all Not Issued Certificates Students:{' '}
          <Link to="/management/students?status=pending" className="font-medium text-brand-600 hover:text-brand-700 hover:underline">
            Click Here ({s?.pendingRecords ?? 0})
          </Link>
        </p>
        <p className="text-slate-700">
          View all Issued Certificates Students:{' '}
          <Link to="/management/students?status=issued" className="font-medium text-brand-600 hover:text-brand-700 hover:underline">
            Click Here ({s?.issuedRecords ?? 0})
          </Link>
        </p>
        <p className="text-slate-700">
          Resend Certificate:{' '}
          <Link to="/management/search" className="font-medium text-brand-600 hover:text-brand-700 hover:underline">
            Click Here
          </Link>
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Latest Certificates</h2>
        {latestQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-10" />)}
          </div>
        ) : latestQuery.data?.data?.length ? (
          <ul className="divide-y divide-slate-100">
            {latestQuery.data.data.map((c) => (
              <li key={c._id} className="py-2.5 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-slate-800">{c.student?.fullName}</p>
                  <p className="text-xs text-slate-500">{c.certificateNumber} &middot; {c.course?.name}</p>
                </div>
                <span className="text-xs text-slate-400">{new Date(c.issueDate).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No certificates issued yet.</p>
        )}
      </div>
    </div>
  );
}
