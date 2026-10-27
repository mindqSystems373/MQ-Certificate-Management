import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { HiOutlineMailOpen, HiOutlinePlus, HiX } from 'react-icons/hi';
import { coursesApi, facultiesApi, gradesApi } from '../../api/lookups';
import { createStudent } from '../../api/students';
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
  const [submittedName, setSubmittedName] = useState(null); // set once submit succeeds -> shows the "awaiting approval" popup

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
      setSubmittedName(data.student.fullName);
      reset();
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
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
              <input className="input" required {...register('fullName')} />
            </Field>
            <Field label="S/O or D/O or W/O" error={errors.guardianName}>
              <input className="input" required {...register('guardianName')} />
            </Field>
            <Field label="Course Name" error={errors.course}>
              <select className="input" required {...register('course')}>
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
              <select className="input" required {...register('faculty')}>
                <option value="">Select Faculty Name</option>
                {activeFaculties.map((f) => (
                  <option key={f._id} value={f._id}>{f.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Grade" error={errors.grade}>
              <select className="input" required {...register('grade')}>
                <option value="">Select grade</option>
                {activeGrades.map((g) => (
                  <option key={g._id} value={g._id}>{g.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Email Address" error={errors.email}>
              <input type="email" className="input" required {...register('email')} />
            </Field>
            <Field label="Contact Number" error={errors.phone}>
              <input className="input" required {...register('phone')} />
            </Field>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <HiOutlinePlus />
            {mutation.isPending ? 'Submitting…' : 'Submit for Approval'}
          </button>
        </form>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-400 h-full flex items-center justify-center text-center">
            Fill in the form and submit — the details go to Management for approval before a certificate is issued.
          </div>
        </div>
      </div>

      {submittedName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl relative">
            <button
              onClick={() => setSubmittedName(null)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              aria-label="Close"
            >
              <HiX />
            </button>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="rounded-full bg-brand-50 p-3 text-brand-600">
                <HiOutlineMailOpen className="text-3xl" />
              </div>
              <p className="font-semibold text-slate-800">Details sent to Management</p>
              <p className="text-sm text-slate-500">
                {submittedName}'s details have been submitted and are awaiting Management's approval. A confirmation
                email has been sent to the student — they'll receive the certificate once it's approved.
              </p>
              <p className="text-sm font-medium text-slate-700">Thank you!</p>
              <button
                onClick={() => setSubmittedName(null)}
                className="mt-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Every field on this form is mandatory (see the zod schema above), so the
// marker is unconditional rather than a per-field prop.
function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label} <span className="text-red-500">*</span>
      </span>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
    </label>
  );
}
