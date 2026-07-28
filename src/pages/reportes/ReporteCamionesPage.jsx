/**
 * ReporteCamionesPage.jsx — [v5 §4.2] Reporte de mantenimiento man_camion.
 * Nota: el esquema real no tiene columna "Modelo" (solo marca/color/año) ni
 * "estado" a nivel de camión; se omiten esas columnas (no se inventan datos).
 */
import { useCallback } from 'react';
import ReportPage from '../../components/common/ReportPage';
import useAuth from '../../hooks/useAuth';
import realApi from '../../api/realApi';
import { lookup } from '../../utils/formatters';

export default function ReporteCamionesPage() {
  const { user } = useAuth();

  const enrich = useCallback(async (items) => {
    const [transportistas, tipos] = await Promise.all([
      realApi.list('transportistas').catch(() => []),
      realApi.list('tipoCamion').catch(() => []),
    ]);
    return items.map((r) => ({
      ...r,
      _transportista: lookup(transportistas, r.id_transportista, 'codigo', 'nombre_comercial'),
      _tipo: lookup(tipos, r.id_tipo_camion),
    }));
  }, []);

  const columns = [
    { key: 'codigo', label: 'Código' },
    { key: 'placa', label: 'Placa' },
    { key: '_tipo', label: 'Tipo' },
    { key: 'marca', label: 'Marca' },
    { key: 'color', label: 'Color' },
    { key: 'anio', label: 'Año' },
    { key: '_transportista', label: 'Transportista' },
  ];

  return (
    <ReportPage
      title="Reporte de Camiones"
      description="Listado de camiones registrados en el sistema."
      recurso="camiones"
      columns={columns}
      searchFields={['codigo', 'placa', 'marca', '_transportista']}
      enrich={enrich}
      usuario={user?.nombre || user?.usuario || ''}
    />
  );
}
