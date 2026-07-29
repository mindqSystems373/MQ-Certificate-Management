import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { HiOutlineCheckCircle, HiOutlineDownload, HiOutlinePlus } from 'react-icons/hi';
import { coursesApi, facultiesApi, gradesApi } from '../../api/lookups';
import { createStudent } from '../../api/students';
import { downloadCertificate } from '../../api/certificates';
import DateInputDMY from '../../components/DateInputDMY';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const schema = z
  .object({
    fullName: z.string().min(2, 'Full name is required'),
    guardianName: z.string().min(2, 'S/O or D/O or W/O is required'),
    course: z.string().min(1, 'Select a course'),
    startDate: z.string().regex(DATE_RE, 'Enter a complete date as DD-MM-YYYY'),
    endDate: z.string().regex(DATE_RE, 'Enter a complete date as DD-MM-YYYY'),
    faculty: z.string().min(1, 'Select a faculty'),
    grade: z.string().min(1, 'Select a grade'),
    email: z.string().email('Enter a valid email'),
    phone: z
      .string()
      .min(7, 'Enter a valid phone number')
      .regex(/^[0-9+\-\s]{7,15}$/, 'Digits, spaces, + and - only'),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export default function AddStudentPage() {
  const queryClient = useQueryClient();
  const [result, setResult] = useState(null); // { student, certificate, downloadUrl }

  const coursesQuery = useQuery({ queryKey: ['courses'], queryFn: () => coursesApi.list() });
  const facultiesQuery = useQuery({ queryKey: ['faculties'], queryFn: () => facultiesApi.list() });
  const gradesQuery = useQuery({ queryKey: ['grades'], queryFn: () => gradesApi.list() });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  // Legacy form pre-selects "Good" as the grade default — most students land there,
  // so this saves a click on the common path without hiding the other options.
  useEffect(() => {
    const grades = gradesQuery.data?.data || [];
    const good = grades.find((g) => g.label === 'Good' && g.isActive);
    if (good && !getValues('grade')) setValue('grade', good._id);
  }, [gradesQuery.data, setValue, getValues]);

  const mutation = useMutation({
    mutationFn: createStudent,
    onSuccess: ({ data }) => {
      toast.success(`Certificate ${data.certificate.certificateNumber} generated`);
      setResult(data);
      reset();
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['latest-certificates'] });
    },
    onError: (err) => {
      const details = err.response?.data?.details;
      toast.error(details?.[0]?.message || err.response?.data?.message || 'Failed to create student');
    },
  });

  const onSubmit = (values) => mutation.mutate(values);

  const activeCourses = (coursesQuery.data?.data || []).filter((c) => c.isActive);
  const activeFaculties = (facultiesQuery.data?.data || []).filter((f) => f.isActive);
  const activeGrades = (gradesQuery.data?.data || []).filter((g) => g.isActive);

  return (
    <div className="max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-800">Students Certificate Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" error={errors.fullName}>
              <input className="input" {...register('fullName')} />
            </Field>
            <Field label="S/O or D/O or W/O" error={errors.guardianName}>
              <input className="input" {...register('guardianName')} />
            </Field>
            <Field label="Course Name" error={errors.course}>
              <select className="input" {...register('course')}>
                <option value="">Select Course Name</option>
                {activeCourses.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <div />
            <Field label="Start Date" error={errors.startDate}>
              <Controller
                name="startDate"
                control={control}
                defaultValue=""
                render={({ field }) => <DateInputDMY value={field.value} onChange={field.onChange} />}
              />
            </Field>
            <Field label="End Date" error={errors.endDate}>
              <Controller
                name="endDate"
                control={control}
                defaultValue=""
                render={({ field }) => <DateInputDMY value={field.value} onChange={field.onChange} />}
              />
            </Field>
            <Field label="Faculty" error={errors.faculty}>
              <select className="input" {...register('faculty')}>
                <option value="">Select Faculty Name</option>
                {activeFaculties.map((f) => (
                  <option key={f._id} value={f._id}>{f.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Grade" error={errors.grade}>
              <select className="input" {...register('grade')}>
                <option value="">Select grade</option>
                {activeGrades.map((g) => (
                  <option key={g._id} value={g._id}>{g.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Email Address" error={errors.email}>
              <input type="email" className="input" {...register('email')} />
            </Field>
            <Field label="Contact Number" error={errors.phone}>
              <input className="input" {...register('phone')} />
            </Field>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <HiOutlinePlus />
            {mutation.isPending ? 'Generating certificate…' : 'Submit & Generate Certificate'}
          </button>
        </form>

        <div className="lg:col-span-2">
          {result ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 sticky top-24">
              <div className="flex items-center gap-2 text-emerald-700">
                <HiOutlineCheckCircle className="text-2xl" />
                <p className="font-semibold">Certificate Generated</p>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <Row label="Student" value={result.student.fullName} />
                <Row label="Certificate No." value={result.certificate.certificateNumber} />
                <Row label="Template Version" value={result.certificate.templateVersion} />
                <Row label="Issue Date" value={new Date(result.certificate.issueDate).toLocaleDateString()} />
              </dl>
              <button
                onClick={() => downloadCertificate(result.certificate.certificateNumber)}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <HiOutlineDownload /> Download PDF
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-400 h-full flex items-center justify-center text-center">
              Fill in the form and submit — the certificate preview and download link will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
    </label>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}
