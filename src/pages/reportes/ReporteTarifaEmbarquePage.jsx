/**
 * ReporteTarifaEmbarquePage.jsx — [v5 §4.1] Reporte de catálogo cat_tarifa_embarque.
 * El valor conserva hasta 5 decimales (cambios v4).
 */
import ReportPage from '../../components/common/ReportPage';
import useAuth from '../../hooks/useAuth';
import Badge from '../../components/common/Badge';
import { formatNumber } from '../../utils/formatters';

const columns = [
  { key: 'codigo', label: 'Código' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'origen', label: 'Origen' },
  { key: 'destino', label: 'Destino' },
  { key: 'valor', label: 'Valor', render: (r) => formatNumber(r.valor, 5), print: (r) => formatNumber(r.valor, 5) },
  { key: 'estado', label: 'Estado', render: (r) => <Badge value={r.estado} />, print: (r) => r.estado },
];

export default function ReporteTarifaEmbarquePage() {
  const { user } = useAuth();
  return (
    <ReportPage
      title="Reporte de Tarifas de Embarque"
      description="Catálogo de tarifas de embarque por origen y destino."
      recurso="tarifaEmbarque"
      columns={columns}
      searchFields={['codigo', 'descripcion', 'origen', 'destino']}
      hasEstado
      usuario={user?.nombre || user?.usuario || ''}
    />
  );
}
