/**
 * ReporteViajesPolizaPage.jsx — [v5 §7] REPORTE DE VIAJES POR PÓLIZA.
 * Filtros: póliza (buscable, obligatoria) + transportista (buscable, opcional;
 * solo se listan los que tienen viajes ACTIVOS en la póliza elegida — null=Todos).
 * Sin transportista se agrupa por transportista con subtotales; con transportista
 * el reporte trae un único grupo. Cálculos resueltos en el backend
 * (reporteViajesPoliza.service.js).
 */
import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import SearchableSelect from '../../components/common/SearchableSelect';
import realApi from '../../api/realApi';
import useAuth from '../../hooks/useAuth';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import { imprimirReporteViajesPoliza } from '../../utils/impresionDocs';

export default function ReporteViajesPolizaPage() {
  const { user } = useAuth();
  const [polizas, setPolizas] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [transportistas, setTransportistas] = useState([]);
  const [polizaId, setPolizaId] = useState('');
  const [transportistaId, setTransportistaId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    (async () => {
      const [po, vj, tr] = await Promise.all([
        realApi.list('polizas').catch(() => []),
        realApi.list('viajes').catch(() => []),
        realApi.list('transportistas').catch(() => []),
      ]);
      setPolizas(po); setViajes(vj); setTransportistas(tr);
    })();
  }, []);

  const polizaOptions = useMemo(
    () => polizas.map((p) => ({ value: p.codigo, label: `${p.nombre_poliza} (${p.estado})` })),
    [polizas]
  );

  // Solo transportistas con al menos un viaje NO ANULADO en la póliza seleccionada
  // (mismo criterio que el backend: reporteViajesPoliza.service.js).
  const transportistaOptions = useMemo(() => {
    if (!polizaId) return [];
    const ids = new Set();
    viajes.forEach((v) => {
      if (String(v.id_poliza) === String(polizaId) && v.estado !== 'ANULADO') ids.add(v.id_transportista);
    });
    return transportistas
      .filter((t) => ids.has(t.codigo))
      .map((t) => ({ value: t.codigo, label: t.nombre_comercial }));
  }, [viajes, transportistas, polizaId]);

  const cambiarPoliza = (v) => { setPolizaId(v); setTransportistaId(''); setData(null); setMessage(null); };

  const generar = async () => {
    setMessage(null);
    if (!polizaId) { setMessage({ type: 'error', text: 'Debe seleccionar una póliza.' }); return; }
    setLoading(true);
    try {
      const params = { poliza_id: polizaId };
      if (transportistaId) params.transportista_id = transportistaId;
      setData(await realApi.reporteViajesPoliza(params));
    } catch (e) {
      setData(null);
      setMessage({ type: 'error', text: e?.userMessage || e?.response?.data?.message || 'No se pudo generar el reporte.' });
    } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Reporte de Viajes por Póliza" description="Viajes de una póliza, agrupados por transportista." />
      {message && <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>}

      <div className="toolbar" style={{ alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 260 }}>
          <SearchableSelect label="Póliza" name="poliza_id" value={polizaId}
            onChange={cambiarPoliza} options={polizaOptions} placeholder="Buscar póliza..." required />
        </div>
        <div style={{ minWidth: 240 }}>
          <SearchableSelect label="Transportista (opcional)" name="transportista_id" value={transportistaId}
            onChange={setTransportistaId} options={transportistaOptions}
            placeholder={polizaId ? 'Todos los de la póliza' : 'Seleccione una póliza primero'}
            disabled={!polizaId} />
        </div>
        <Button variant="primary" icon="🔍" onClick={generar} disabled={loading}>{loading ? 'Generando...' : 'Generar'}</Button>
        {data && (
          <Button variant="secondary" icon="🖨️" onClick={() => imprimirReporteViajesPoliza(data, user?.nombre || user?.usuario || '')}>
            Imprimir
          </Button>
        )}
      </div>

      {loading ? (
        <div className="card"><div className="card-body">Generando reporte...</div></div>
      ) : !data ? (
        <div className="card"><div className="card-body" style={{ color: '#6b7280' }}>Seleccione una póliza y presione «Generar».</div></div>
      ) : data.grupos.length === 0 ? (
        <div className="card"><div className="card-body" style={{ color: '#6b7280' }}>No hay viajes para esta póliza.</div></div>
      ) : (
        <>
          {data.grupos.map((g) => (
            <div className="table-wrapper" key={g.id_transportista} style={{ marginBottom: 14 }}>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr style={{ background: '#1f3d5c' }}>
                      <th colSpan={7} style={{ color: '#fff' }}>{g.transportista}</th>
                    </tr>
                    <tr>
                      <th>C. Porte</th><th>Fecha</th><th>Piloto</th><th>Placa</th>
                      <th style={{ textAlign: 'right' }}>Peso qq</th>
                      <th style={{ textAlign: 'right' }}>Total pagado</th><th>Destino</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.filas.map((fila) => (
                      <tr key={fila.correlativo}>
                        <td>{fila.num_envio}</td>
                        <td>{formatDate(fila.fecha)}</td>
                        <td>{fila.piloto}</td>
                        <td>{fila.placa}</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(fila.peso_qq)}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(fila.valor)}</td>
                        <td>{fila.destino}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ fontWeight: 700 }}>
                      <td colSpan={4}>Subtotal ({g.subtotal_viajes} viajes)</td>
                      <td style={{ textAlign: 'right' }}>{formatNumber(g.subtotal_peso_qq)}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(g.subtotal_pagado)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
          <div className="card"><div className="card-body" style={{ display: 'flex', gap: 24, fontWeight: 700 }}>
            <span>Viajes: {data.totales.total_viajes}</span>
            <span>Peso: {formatNumber(data.totales.total_peso_qq)} qq</span>
            <span>Total pagado: {formatCurrency(data.totales.total_pagado)}</span>
          </div></div>
        </>
      )}
    </div>
  );
}
