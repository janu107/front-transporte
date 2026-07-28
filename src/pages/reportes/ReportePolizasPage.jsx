/**
 * ReportePolizasPage.jsx — [v5 §4.2] Reporte de mantenimiento man_poliza.
 * Nota: el esquema real no guarda Origen/Destino ni fecha de inicio/fin a nivel
 * de póliza (esos datos viven por viaje, vía cat_tarifa_embarque); se muestran
 * en su lugar `fecha` y `fecha_liquidacion`, y se omiten Origen/Destino.
 * "Cantidad de viajes" se calcula contando pro_poliza_detalle por póliza.
 */
import { useCallback } from 'react';
import ReportPage from '../../components/common/ReportPage';
import useAuth from '../../hooks/useAuth';
import Badge from '../../components/common/Badge';
import realApi from '../../api/realApi';
import { formatDate, formatNumber } from '../../utils/formatters';

export default function ReportePolizasPage() {
  const { user } = useAuth();

  const enrich = useCallback(async (items) => {
    const viajes = await realApi.list('viajes').catch(() => []);
    const conteo = new Map();
    viajes.forEach((v) => conteo.set(v.id_poliza, (conteo.get(v.id_poliza) || 0) + 1));
    return items.map((r) => ({ ...r, _viajes: conteo.get(r.codigo) || 0 }));
  }, []);

  const columns = [
    { key: 'codigo', label: 'Código' },
    { key: 'nombre_poliza', label: 'Nombre' },
    { key: 'fecha', label: 'Fecha', render: (r) => formatDate(r.fecha), print: (r) => formatDate(r.fecha) },
    { key: 'fecha_liquidacion', label: 'Fecha liquidación', render: (r) => formatDate(r.fecha_liquidacion), print: (r) => formatDate(r.fecha_liquidacion) },
    { key: 'cantidad_piezas', label: 'Piezas', render: (r) => formatNumber(r.cantidad_piezas, 0), print: (r) => formatNumber(r.cantidad_piezas, 0) },
    { key: '_viajes', label: 'Viajes realizados' },
    { key: 'estado', label: 'Estado', render: (r) => <Badge value={r.estado} />, print: (r) => r.estado },
  ];

  return (
    <ReportPage
      title="Reporte de Pólizas"
      description="Listado de pólizas registradas en el sistema."
      recurso="polizas"
      columns={columns}
      searchFields={['codigo', 'nombre_poliza']}
      enrich={enrich}
      hasEstado
      usuario={user?.nombre || user?.usuario || ''}
    />
  );
}
