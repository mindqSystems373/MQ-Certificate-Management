import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { toast } from 'react-toastify';
import { HiOutlineSearch, HiOutlineCheckCircle } from 'react-icons/hi';
import { listStudents, approveStudents } from '../../api/students';
import CertificateActions from '../../components/CertificateActions';

const STATUS_LABELS = { issued: 'Issued Certificates', pending: 'Not Issued Certificates' };

export default function StudentsListPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || '';
  const isPendingView = status === 'pending';
  const [q, setQ] = useState('');
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [selectedIds, setSelectedIds] = useState([]);

  const studentsQuery = useQuery({
    queryKey: ['students', q, status, paginationModel.page, paginationModel.pageSize],
    queryFn: () =>
      listStudents({
        q: q || undefined,
        status: status || undefined,
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
      }),
    placeholderData: (prev) => prev,
  });

  const rows = studentsQuery.data?.data?.items || [];
  const total = studentsQuery.data?.data?.pagination?.total || 0;

  useEffect(() => {
    setSelectedIds([]);
  }, [status]);

  const approveMutation = useMutation({
    mutationFn: approveStudents,
    onSuccess: ({ data }) => {
      if (data.approved.length) toast.success(`${data.approved.length} certificate(s) issued`);
      if (data.failed.length) toast.error(`${data.failed.length} could not be approved`);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['latest-certificates'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to approve selected students'),
  });

  function clearStatusFilter() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('status');
      return next;
    });
    setPaginationModel((p) => ({ ...p, page: 0 }));
  }

  const columns = useMemo(
    () => [
      { field: 'studentId', headerName: 'Id', width: 110 },
      {
        field: 'fullName',
        headerName: 'Name - Email',
        flex: 1.4,
        minWidth: 200,
        renderCell: (params) => (
          <div className="py-1.5 leading-tight">
            <p className="font-medium text-slate-800">{params.row.fullName}</p>
            <p className="text-xs text-brand-600">{params.row.email}</p>
          </div>
        ),
      },
      { field: 'phone', headerName: 'Phone', flex: 0.8, minWidth: 120 },
      { field: 'courseName', headerName: 'Course', flex: 1, minWidth: 150, valueGetter: (_, row) => row.course?.name },
      { field: 'facultyName', headerName: 'Faculty', flex: 0.9, minWidth: 130, valueGetter: (_, row) => row.faculty?.name },
      {
        field: 'startDate',
        headerName: 'StartDate',
        width: 110,
        valueGetter: (_, row) => (row.startDate ? new Date(row.startDate).toLocaleDateString('en-GB') : ''),
      },
      {
        field: 'endDate',
        headerName: 'EndDate',
        width: 110,
        valueGetter: (_, row) => (row.endDate ? new Date(row.endDate).toLocaleDateString('en-GB') : ''),
      },
      { field: 'certificateNumber', headerName: 'CertificateNo.', flex: 1, minWidth: 150 },
      {
        field: 'status',
        headerName: 'Status',
        width: 110,
        renderCell: (params) => (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              params.value === 'issued' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {params.value}
          </span>
        ),
      },
      {
        field: 'createdAt',
        headerName: 'Form Submitted Date',
        width: 150,
        valueGetter: (_, row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-GB') : ''),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 140,
        sortable: false,
        renderCell: (params) => (
          <CertificateActions certificateNumber={params.row.certificateNumber} disabled={params.row.status !== 'issued'} />
        ),
      },
    ],
    []
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search by name, email, phone or certificate no."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPaginationModel((p) => ({ ...p, page: 0 }));
            }}
          />
        </div>
        {status && (
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
            Filtered: {STATUS_LABELS[status] || status}
            <button onClick={clearStatusFilter} className="text-brand-500 hover:text-brand-800">&times;</button>
          </span>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-2" style={{ height: 560 }}>
        <DataGrid
          rows={rows}
          getRowId={(row) => row._id}
          columns={columns}
          rowCount={total}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          loading={studentsQuery.isFetching}
          disableRowSelectionOnClick
          checkboxSelection={isPendingView}
          rowSelectionModel={{ type: 'include', ids: new Set(selectedIds) }}
          onRowSelectionModelChange={(model) => setSelectedIds(Array.from(model.ids))}
          sx={{ border: 0, fontSize: 13.5 }}
        />
      </div>

      {isPendingView && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-sm text-slate-500">{selectedIds.length} selected</p>
          <button
            disabled={selectedIds.length === 0 || approveMutation.isPending}
            onClick={() => approveMutation.mutate(selectedIds)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HiOutlineCheckCircle />
            {approveMutation.isPending ? 'Approving…' : 'Approve'}
          </button>
        </div>
      )}
    </div>
  );
}
