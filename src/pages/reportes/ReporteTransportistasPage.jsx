/**
 * ReporteTransportistasPage.jsx — [v5 §4.2] Reporte de mantenimiento man_transportista.
 */
import ReportPage from '../../components/common/ReportPage';
import useAuth from '../../hooks/useAuth';
import Badge from '../../components/common/Badge';

const columns = [
  { key: 'codigo', label: 'Código' },
  { key: 'nombre_comercial', label: 'Nombre comercial' },
  { key: 'nit', label: 'NIT' },
  { key: 'direccion', label: 'Dirección' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'estado', label: 'Estado', render: (r) => <Badge value={r.estado} />, print: (r) => r.estado },
];

export default function ReporteTransportistasPage() {
  const { user } = useAuth();
  return (
    <ReportPage
      title="Reporte de Transportistas"
      description="Listado de transportistas registrados en el sistema."
      recurso="transportistas"
      columns={columns}
      searchFields={['codigo', 'nombre_comercial', 'nit']}
      hasEstado
      usuario={user?.nombre || user?.usuario || ''}
    />
  );
}
