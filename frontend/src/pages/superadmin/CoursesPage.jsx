import ManageEntityPage from '../../components/ManageEntityPage';
import { coursesApi } from '../../api/lookups';

export default function CoursesPage() {
  return (
    <ManageEntityPage
      title="Course"
      queryKey="courses"
      api={coursesApi}
      nameKey="name"
      fields={[
        { name: 'name', label: 'Course Name', required: true },
        { name: 'code', label: 'Course Code' },
        { name: 'durationWeeks', label: 'Duration (weeks)', type: 'number' },
      ]}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'durationWeeks', label: 'Duration (wks)' },
      ]}
    />
  );
}
