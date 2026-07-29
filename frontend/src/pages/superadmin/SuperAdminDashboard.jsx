import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  HiOutlineUsers,
  HiOutlineBadgeCheck,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineUserAdd,
  HiOutlineDocumentSearch,
} from 'react-icons/hi';
import { getDashboardSummary, getLatestCertificates, getRecentActivity } from '../../api/dashboard';
import StatCard from '../../components/StatCard';

export default function SuperAdminDashboard() {
  const summaryQuery = useQuery({ queryKey: ['dashboard-summary'], queryFn: getDashboardSummary });
  const latestQuery = useQuery({ queryKey: ['latest-certificates'], queryFn: () => getLatestCertificates(5) });
  const activityQuery = useQuery({ queryKey: ['recent-activity'], queryFn: () => getRecentActivity(8) });

  const s = summaryQuery.data?.data;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Students" value={s?.totalStudents ?? '—'} icon={HiOutlineUsers} loading={summaryQuery.isLoading} />
        <StatCard label="Issued Certificates" value={s?.issuedRecords ?? '—'} icon={HiOutlineBadgeCheck} accent="emerald" loading={summaryQuery.isLoading} />
        <StatCard label="Pending Certificates" value={s?.pendingRecords ?? '—'} icon={HiOutlineClock} accent="amber" loading={summaryQuery.isLoading} />
        <StatCard label="Generated Today" value={s?.certificatesToday ?? '—'} icon={HiOutlineCalendar} accent="gold" loading={summaryQuery.isLoading} />
        <StatCard label="Generated This Month" value={s?.certificatesThisMonth ?? '—'} icon={HiOutlineCalendar} accent="brand" loading={summaryQuery.isLoading} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/students/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            <HiOutlineUserAdd /> Enter Student Data
          </Link>
          <Link
            to="/admin/certificates/view"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <HiOutlineDocumentSearch /> View Certificate
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Recent Activity</h2>
          {activityQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-10" />)}
            </div>
          ) : activityQuery.data?.data?.length ? (
            <ul className="divide-y divide-slate-100">
              {activityQuery.data.data.map((a) => (
                <li key={a._id} className="py-2.5 text-sm">
                  <p className="text-slate-700">{a.description}</p>
                  <p className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">No activity logged yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
