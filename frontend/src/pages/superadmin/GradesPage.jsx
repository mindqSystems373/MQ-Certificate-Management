import ManageEntityPage from '../../components/ManageEntityPage';
import { gradesApi } from '../../api/lookups';

export default function GradesPage() {
  return (
    <ManageEntityPage
      title="Grade"
      queryKey="grades"
      api={gradesApi}
      nameKey="label"
      fields={[
        { name: 'label', label: 'Grade Label', required: true },
        { name: 'minPercentage', label: 'Min Percentage', type: 'number' },
      ]}
      columns={[
        { key: 'label', label: 'Label' },
        { key: 'minPercentage', label: 'Min %' },
      ]}
    />
  );
}
