/**
 * ReportePolizasPendientesPage.jsx — [2026-08 §10]
 * REPORTE DE PÓLIZAS PENDIENTES DE LIQUIDAR.
 * Parámetro: estados (Activas / Liquidadas / Anuladas; uno o varios).
 * Columnas: No, Póliza, Fecha, Peso (kgrs), Bultos, Piezas.
 */
import { useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import realApi from '../../api/realApi';
import useAuth from '../../hooks/useAuth';
import { formatNumber, formatDate } from '../../utils/formatters';
import { imprimirReporteGenerico } from '../../utils/impresionDocs';
import { exportarExcel } from '../../utils/excel';

// Etiqueta -> estado real de man_poliza.
const ESTADOS = [
  { key: 'ABIERTA', label: 'Activas (abiertas)' },
  { key: 'LIQUIDADA', label: 'Liquidadas' },
  { key: 'ANULADA', label: 'Anuladas' },
];

export default function ReportePolizasPendientesPage() {
  const { user } = useAuth();
  const [sel, setSel] = useState({ ABIERTA: true, LIQUIDADA: false, ANULADA: false });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const toggle = (k) => setSel((p) => ({ ...p, [k]: !p[k] }));

  const generar = async () => {
    setMessage(null);
    const estados = Object.entries(sel).filter(([, v]) => v).map(([k]) => k);
    if (!estados.length) { setMessage({ type: 'error', text: 'Seleccione al menos un estado.' }); return; }
    setLoading(true);
    try {
      setData(await realApi.reportePolizasPendientes({ estados: estados.join(',') }));
    } catch (e) {
      setData(null);
      setMessage({ type: 'error', text: e?.userMessage || e?.response?.data?.message || 'No se pudo generar el reporte.' });
    } finally { setLoading(false); }
  };

  const columnasSalida = (paraExcel = false) => [
    { label: 'No.', get: (r) => r._no },
    { label: 'Póliza', get: (r) => r.nombre_poliza },
    { label: 'Fecha', get: (r) => formatDate(r.fecha) },
    { label: 'Estado', get: (r) => r.estado },
    // En Excel los números van sin formato para poder sumarlos en la hoja.
    { label: 'Peso Kgrs', get: (r) => (paraExcel ? Number(r.peso_total || 0) : formatNumber(r.peso_total, 2)) },
    { label: 'Bultos', get: (r) => (paraExcel ? Number(r.cantidad_bultos || 0) : formatNumber(r.cantidad_bultos, 0)) },
    { label: 'Piezas', get: (r) => (paraExcel ? Number(r.cantidad_piezas || 0) : formatNumber(r.cantidad_piezas, 0)) },
  ];
  const filasNumeradas = () => (data?.polizas || []).map((p, i) => ({ ...p, _no: i + 1 }));

  const imprimir = () => {
    if (!data) return;
    imprimirReporteGenerico('Reporte de Pólizas Pendientes de Liquidar',
      columnasSalida(false), filasNumeradas(), user?.nombre || user?.usuario || '');
  };

  // [V9 §6]
  const exportar = () => {
    if (!data) return;
    exportarExcel('Pólizas Pendientes de Liquidar', columnasSalida(true), filasNumeradas(), {
      meta: [['Usuario', user?.nombre || user?.usuario || ''],
        ['Estados', (data.estados || []).join(', ')],
        ['Pólizas', data.totales?.total_polizas], ['Peso total', data.totales?.total_peso]],
    });
  };

  return (
    <div>
      <PageHeader title="Pólizas Pendientes de Liquidar" description="Pólizas por estado, con su peso (kgrs), bultos y piezas." />
      {message && <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>}

      {/* Filtro de estados */}
      <div className="toolbar" style={{ alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Estados:</span>
        {ESTADOS.map((e) => (
          <label key={e.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={sel[e.key]} onChange={() => toggle(e.key)} />
            {e.label}
          </label>
        ))}
        <Button variant="primary" icon="🔍" onClick={generar} disabled={loading}>{loading ? 'Generando...' : 'Generar'}</Button>
        {data && data.polizas.length > 0 && (
          <>
            <Button variant="secondary" icon="📊" onClick={exportar}>Exportar Excel</Button>
            <Button variant="secondary" icon="🖨️" onClick={imprimir}>Imprimir</Button>
          </>
        )}
      </div>

      {loading ? (
        <div className="card"><div className="card-body">Generando reporte...</div></div>
      ) : !data ? (
        <div className="card"><div className="card-body" style={{ color: '#6b7280' }}>Seleccione los estados y presione «Generar».</div></div>
      ) : data.polizas.length === 0 ? (
        <div className="card"><div className="card-body" style={{ color: '#6b7280' }}>No hay pólizas para los estados seleccionados.</div></div>
      ) : (
        <>
          <div className="table-wrapper">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No.</th><th>Póliza</th><th>Fecha</th>
                    <th style={{ textAlign: 'right' }}>Peso Kgrs</th>
                    <th style={{ textAlign: 'right' }}>Bultos</th>
                    <th style={{ textAlign: 'right' }}>Piezas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.polizas.map((p, i) => (
                    <tr key={p.codigo}>
                      <td>{i + 1}</td>
                      <td>{p.nombre_poliza}</td>
                      <td>{formatDate(p.fecha)}</td>
                      <td style={{ textAlign: 'right' }}>{formatNumber(p.peso_total, 2)}</td>
                      <td style={{ textAlign: 'right' }}>{formatNumber(p.cantidad_bultos, 0)}</td>
                      <td style={{ textAlign: 'right' }}>{formatNumber(p.cantidad_piezas, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <span>{data.totales.total_polizas} póliza(s)</span>
              <span>
                Peso: {formatNumber(data.totales.total_peso, 2)} · Bultos: {formatNumber(data.totales.total_bultos, 0)} · Piezas: {formatNumber(data.totales.total_piezas, 0)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
