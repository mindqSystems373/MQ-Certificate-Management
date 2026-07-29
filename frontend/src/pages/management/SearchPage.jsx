import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HiOutlineSearch } from 'react-icons/hi';
import { searchCertificates } from '../../api/certificates';
import { coursesApi, facultiesApi } from '../../api/lookups';
import CertificateActions from '../../components/CertificateActions';
import TableSkeleton from '../../components/TableSkeleton';

const emptyFilters = { q: '', course: '', faculty: '', status: '', dateFrom: '', dateTo: '' };

export default function SearchPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);

  const coursesQuery = useQuery({ queryKey: ['courses'], queryFn: () => coursesApi.list() });
  const facultiesQuery = useQuery({ queryKey: ['faculties'], queryFn: () => facultiesApi.list() });

  const resultsQuery = useQuery({
    queryKey: ['certificate-search', appliedFilters, page],
    queryFn: () =>
      searchCertificates({
        ...Object.fromEntries(Object.entries(appliedFilters).filter(([, v]) => v)),
        page,
        limit: 10,
      }),
    placeholderData: (prev) => prev,
  });

  function handleSubmit(e) {
    e.preventDefault();
    setPage(1);
    setAppliedFilters(filters);
  }

  function handleReset() {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  }

  const items = resultsQuery.data?.data?.items || [];
  const pagination = resultsQuery.data?.data?.pagination;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <label className="block sm:col-span-2 lg:col-span-3">
          <span className="text-sm font-medium text-slate-700">Search by certificate number or student name</span>
          <input
            className="input mt-1"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="MQHYD000001 or Aarav Sharma"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Course</span>
          <select className="input mt-1" value={filters.course} onChange={(e) => setFilters((f) => ({ ...f, course: e.target.value }))}>
            <option value="">All courses</option>
            {(coursesQuery.data?.data || []).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Faculty</span>
          <select className="input mt-1" value={filters.faculty} onChange={(e) => setFilters((f) => ({ ...f, faculty: e.target.value }))}>
            <option value="">All faculty</option>
            {(facultiesQuery.data?.data || []).map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Certificate Status</span>
          <select className="input mt-1" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            <option value="">Any</option>
            <option value="issued">Issued</option>
            <option value="resent">Resent</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Issue Date From</span>
          <input type="date" className="input mt-1" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Issue Date To</span>
          <input type="date" className="input mt-1" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} />
        </label>

        <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
          <button type="submit" className="btn-primary">
            <HiOutlineSearch /> Search
          </button>
          <button type="button" onClick={handleReset} className="btn-secondary">
            Clear filters
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">
          Results {pagination ? `(${pagination.total})` : ''}
        </h2>
        {resultsQuery.isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-4 font-medium">Student</th>
                  <th className="py-2 pr-4 font-medium">Course</th>
                  <th className="py-2 pr-4 font-medium">Faculty</th>
                  <th className="py-2 pr-4 font-medium">Certificate No.</th>
                  <th className="py-2 pr-4 font-medium">Issue Date</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c._id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-slate-800">{c.studentNameSnapshot}</p>
                      <p className="text-xs text-slate-500">{c.student?.email}</p>
                    </td>
                    <td className="py-2.5 pr-4">{c.course?.name}</td>
                    <td className="py-2.5 pr-4">{c.faculty?.name}</td>
                    <td className="py-2.5 pr-4">{c.certificateNumber}</td>
                    <td className="py-2.5 pr-4">{new Date(c.issueDate).toLocaleDateString()}</td>
                    <td className="py-2.5 pr-4 capitalize">{c.status}</td>
                    <td className="py-2.5 text-right">
                      <div className="flex justify-end">
                        <CertificateActions certificateNumber={c.certificateNumber} />
                      </div>
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">No certificates match your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>Page {pagination.page} of {pagination.pages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary disabled:opacity-40">Previous</button>
              <button disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="btn-secondary disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
