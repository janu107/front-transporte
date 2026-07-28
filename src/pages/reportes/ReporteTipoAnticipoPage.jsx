/**
 * ReporteTipoAnticipoPage.jsx — [v5 §4.1] Reporte de catálogo cat_tipo_anticipo_provision.
 */
import ReportPage from '../../components/common/ReportPage';
import useAuth from '../../hooks/useAuth';
import { formatDate } from '../../utils/formatters';

const columns = [
  { key: 'codigo', label: 'Código' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'fecha_hora_graba', label: 'Fecha de creación', render: (r) => formatDate(r.fecha_hora_graba) },
];

export default function ReporteTipoAnticipoPage() {
  const { user } = useAuth();
  return (
    <ReportPage
      title="Reporte de Tipo de Anticipos"
      description="Catálogo de tipos de anticipo/provisión registrados en el sistema."
      recurso="tipoAnticipoProvision"
      columns={columns}
      searchFields={['codigo', 'descripcion']}
      usuario={user?.nombre || user?.usuario || ''}
    />
  );
}
