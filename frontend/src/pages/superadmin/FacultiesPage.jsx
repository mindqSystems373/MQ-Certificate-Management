import ManageEntityPage from '../../components/ManageEntityPage';
import { facultiesApi } from '../../api/lookups';

export default function FacultiesPage() {
  return (
    <ManageEntityPage
      title="Faculty"
      queryKey="faculties"
      api={facultiesApi}
      nameKey="name"
      fields={[
        { name: 'name', label: 'Faculty Name', required: true },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'specialization', label: 'Specialization' },
      ]}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'specialization', label: 'Specialization' },
      ]}
    />
  );
}
