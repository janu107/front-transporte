/**
 * ReportePilotosPage.jsx — [v5 §4.2] Reporte de mantenimiento man_pilotos.
 */
import { useCallback } from 'react';
import ReportPage from '../../components/common/ReportPage';
import useAuth from '../../hooks/useAuth';
import Badge from '../../components/common/Badge';
import realApi from '../../api/realApi';
import { lookup, formatDate } from '../../utils/formatters';

export default function ReportePilotosPage() {
  const { user } = useAuth();

  const enrich = useCallback(async (items) => {
    const transportistas = await realApi.list('transportistas').catch(() => []);
    return items.map((r) => ({
      ...r,
      _nombre: `${r.nombres} ${r.apellidos || ''}`.trim(),
      _transportista: lookup(transportistas, r.id_transportista, 'codigo', 'nombre_comercial'),
    }));
  }, []);

  const columns = [
    { key: 'codigo', label: 'Código' },
    { key: '_nombre', label: 'Nombre completo' },
    { key: 'licencia', label: 'Licencia' },
    { key: 'fecha_vigencia', label: 'Vencimiento', render: (r) => formatDate(r.fecha_vigencia), print: (r) => formatDate(r.fecha_vigencia) },
    { key: '_transportista', label: 'Transportista' },
    { key: 'estado', label: 'Estado', render: (r) => <Badge value={r.estado} />, print: (r) => r.estado },
  ];

  return (
    <ReportPage
      title="Reporte de Pilotos"
      description="Listado de pilotos registrados en el sistema."
      recurso="pilotos"
      columns={columns}
      searchFields={['codigo', 'licencia', '_nombre', '_transportista']}
      enrich={enrich}
      hasEstado
      usuario={user?.nombre || user?.usuario || ''}
    />
  );
}
