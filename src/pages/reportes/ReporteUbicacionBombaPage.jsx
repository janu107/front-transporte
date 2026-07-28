/**
 * ReporteUbicacionBombaPage.jsx — [v5 §4.1] Reporte de catálogo cat_ubicacion_bomba.
 */
import ReportPage from '../../components/common/ReportPage';
import useAuth from '../../hooks/useAuth';

const columns = [
  { key: 'codigo', label: 'Código' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'direccion', label: 'Dirección' },
  { key: 'encargado', label: 'Encargado' },
];

export default function ReporteUbicacionBombaPage() {
  const { user } = useAuth();
  return (
    <ReportPage
      title="Reporte de Ubicación de Bomba"
      description="Catálogo de predios/ubicaciones de bombas de combustible."
      recurso="ubicacionBomba"
      columns={columns}
      searchFields={['codigo', 'descripcion', 'direccion', 'encargado']}
      usuario={user?.nombre || user?.usuario || ''}
    />
  );
}
