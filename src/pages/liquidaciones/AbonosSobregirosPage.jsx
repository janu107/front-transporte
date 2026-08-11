/**
 * AbonosSobregirosPage.jsx — [V9 §7] SOBREGIROS (solo consulta).
 *
 * El registro de abonos se retiró: esta pantalla únicamente muestra los
 * sobregiros abiertos, con el detalle de la liquidación y la póliza que los
 * originó, y el consolidado por transportista.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';
import Badge from '../../components/common/Badge';
import LiquidacionTabs from '../../components/liquidaciones/LiquidacionTabs';
import realApi from '../../api/realApi';
import useAuth from '../../hooks/useAuth';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportarExcel } from '../../utils/excel';

export default function AbonosSobregirosPage() {
  const { user } = useAuth();
  const [porTransportista, setPorTransportista] = useState([]);
  const [detalle, setDetalle] = useState([]);
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true); setMessage(null);
    try {
      const [consolidado, porLiquidacion] = await Promise.all([
        realApi.liquidacionV2Sobregiros(),
        realApi.liquidacionV2SobregirosDetalle().catch(() => []),
      ]);
      setPorTransportista(consolidado);
      setDetalle(porLiquidacion);
    } catch (e) {
      setMessage({ type: 'error', text: e?.userMessage || 'No se pudieron cargar los sobregiros.' });
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const q = term.trim().toLowerCase();
  const coincide = (campos) => !q || campos.some((c) => String(c ?? '').toLowerCase().includes(q));

  const detalleFiltrado = useMemo(
    () => detalle.filter((r) => coincide([r.nombre_comercial, r.nit, r.num_liquidacion, r.nombre_poliza])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [detalle, q]
  );
  const consolidadoFiltrado = useMemo(
    () => porTransportista.filter((r) => coincide([r.nombre_comercial, r.nit])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [porTransportista, q]
  );

  const totalPendiente = consolidadoFiltrado.reduce((s, r) => s + Number(r.saldo_pendiente || 0), 0);

  const exportar = () => exportarExcel('Sobregiros por Liquidación', [
    { label: 'Transportista', get: (r) => r.nombre_comercial },
    { label: 'NIT', get: (r) => r.nit },
    { label: 'N° Liquidación', get: (r) => r.num_liquidacion || '' },
    { label: 'Póliza', get: (r) => r.nombre_poliza || '' },
    { label: 'Fecha', get: (r) => (r.fecha_liquidacion ? formatDate(r.fecha_liquidacion) : '') },
    { label: 'Sobregiro', get: (r) => Number(r.sobregiro_total || 0) },
    { label: 'Abonado', get: (r) => Number(r.total_abonado || 0) },
    { label: 'Saldo pendiente', get: (r) => Number(r.saldo_pendiente || 0) },
    { label: 'Estado', get: (r) => r.estado },
  ], detalleFiltrado, {
    meta: [['Usuario', user?.nombre || user?.usuario || ''],
      ['Búsqueda', term || ''], ['Saldo pendiente total', totalPendiente]],
  });

  return (
    <div>
      <PageHeader title="Sobregiros"
        description="Saldos negativos por liquidación y transportista. Consulta de solo lectura." />
      <LiquidacionTabs />
      {message && <div className="alert alert-error">{message.text}</div>}

      <div className="toolbar" style={{ alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', maxWidth: 420 }}>
          <SearchBar value={term} onChange={setTerm}
            placeholder="Buscar por transportista, NIT, liquidación o póliza..." />
        </div>
        <Button variant="secondary" icon="🔄" onClick={cargar} disabled={loading}>Actualizar</Button>
        <Button variant="secondary" icon="📊" onClick={exportar} disabled={!detalleFiltrado.length}>
          Exportar Excel
        </Button>
      </div>

      {/* Detalle: de qué liquidación salió cada sobregiro */}
      <h4 style={{ margin: '4px 0 8px' }}>Sobregiros por liquidación</h4>
      <div className="table-wrapper table-wrapper--cards"><div className="table-scroll"><table className="data-table">
        <thead><tr>
          <th>Transportista</th><th>N° Liquidación</th><th>Póliza</th><th>Fecha</th>
          <th style={{ textAlign: 'right' }}>Sobregiro</th>
          <th style={{ textAlign: 'right' }}>Abonado</th>
          <th style={{ textAlign: 'right' }}>Saldo pendiente</th>
          <th>Estado</th>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32 }}>Cargando...</td></tr>
          ) : detalleFiltrado.length === 0 ? (
            <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>
              {detalle.length === 0 ? 'No hay sobregiros registrados.' : 'Sin resultados para la búsqueda.'}
            </td></tr>
          ) : detalleFiltrado.map((r) => (
            <tr key={r.correlativo}>
              <td data-label="Transportista">
                {r.nombre_comercial}
                <div style={{ fontSize: 11, color: '#6b7280' }}>{r.nit}</div>
              </td>
              <td data-label="N° Liquidación">{r.num_liquidacion || '—'}</td>
              <td data-label="Póliza">{r.nombre_poliza || '—'}</td>
              <td data-label="Fecha">{r.fecha_liquidacion ? formatDate(r.fecha_liquidacion) : '—'}</td>
              <td data-label="Sobregiro" style={{ textAlign: 'right' }}>{formatCurrency(r.sobregiro_total)}</td>
              <td data-label="Abonado" style={{ textAlign: 'right' }}>{formatCurrency(r.total_abonado)}</td>
              <td data-label="Saldo pendiente" style={{ textAlign: 'right', fontWeight: 700, color: Number(r.saldo_pendiente) > 0 ? '#c1121f' : undefined }}>
                {formatCurrency(r.saldo_pendiente)}
              </td>
              <td data-label="Estado"><Badge value={r.estado} /></td>
            </tr>
          ))}
        </tbody>
      </table></div></div>

      {/* Consolidado por transportista */}
      <h4 style={{ margin: '20px 0 8px' }}>Consolidado por transportista</h4>
      <div className="table-wrapper table-wrapper--cards"><div className="table-scroll"><table className="data-table">
        <thead><tr>
          <th>Transportista</th>
          <th style={{ textAlign: 'right' }}>Sobregiro total</th>
          <th style={{ textAlign: 'right' }}>Abonado</th>
          <th style={{ textAlign: 'right' }}>Saldo pendiente</th>
          <th>Estado</th>
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32 }}>Cargando...</td></tr>
          ) : consolidadoFiltrado.length === 0 ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>No hay sobregiros.</td></tr>
          ) : consolidadoFiltrado.map((r) => (
            <tr key={r.id_transportista}>
              <td data-label="Transportista">
                {r.nombre_comercial}
                <div style={{ fontSize: 11, color: '#6b7280' }}>{r.nit}</div>
              </td>
              <td data-label="Sobregiro total" style={{ textAlign: 'right' }}>{formatCurrency(r.sobregiro_total)}</td>
              <td data-label="Abonado" style={{ textAlign: 'right' }}>{formatCurrency(r.total_abonado)}</td>
              <td data-label="Saldo pendiente" style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(r.saldo_pendiente)}</td>
              <td data-label="Estado"><Badge value={r.estado} /></td>
            </tr>
          ))}
        </tbody>
        {consolidadoFiltrado.length > 0 && (
          <tfoot><tr style={{ fontWeight: 700 }}>
            <td colSpan={3} style={{ textAlign: 'right' }}>Saldo pendiente total</td>
            <td style={{ textAlign: 'right' }}>{formatCurrency(totalPendiente)}</td>
            <td />
          </tr></tfoot>
        )}
      </table></div></div>

      <p style={{ fontSize: 12, color: '#6b7280', marginTop: 10 }}>
        Los sobregiros se aplican automáticamente al generar la siguiente liquidación
        del transportista. Esta pantalla es de consulta.
      </p>
    </div>
  );
}
