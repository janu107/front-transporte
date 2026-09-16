import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import SearchableSelect from '../../components/common/SearchableSelect';
import useAuth from '../../hooks/useAuth';
import realApi from '../../api/realApi';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { imprimirLiquidacionPorPoliza } from '../../utils/impresionDocs';
import { exportarExcel } from '../../utils/excel';

export default function ReporteLiquidacionPorPolizaPage() {
  const { user } = useAuth();
  const [polizas, setPolizas] = useState([]);
  const [idPoliza, setIdPoliza] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  useEffect(() => { realApi.list('polizas').then(setPolizas).catch(() => {}); }, []);
  const opciones = useMemo(() => polizas.map((p) => ({ value: p.codigo, label: `${p.nombre_poliza} (${p.estado || 'SIN ESTADO'})` })), [polizas]);
  const usuario = user?.nombre || user?.usuario || '';
  const generar = async () => {
    if (!idPoliza) { setMessage({ type: 'error', text: 'Debe seleccionar una póliza.' }); return; }
    setLoading(true); setMessage(null);
    try { setData(await realApi.reporteLiquidacionPorPoliza({ id_poliza: idPoliza })); }
    catch (e) { setData(null); setMessage({ type: 'error', text: e?.userMessage || 'No se pudo generar el reporte.' }); }
    finally { setLoading(false); }
  };
  const t = data?.totales || {};
  const exportar = () => exportarExcel('Deatalles de los transportistas', [
    { label: 'ID', get: (f) => f.nit }, { label: 'Transportista', get: (f) => f.transportista },
    { label: 'Viajes', get: (f) => Number(f.viajes || 0) }, { label: 'Peso qq', get: (f) => Number(f.peso_qq || 0) },
    { label: 'Flete', get: (f) => Number(f.flete || 0) }, { label: 'Anticipo', get: (f) => Number(f.anticipo || 0) },
    { label: 'Diesel', get: (f) => Number(f.diesel || 0) }, { label: 'Manejo', get: (f) => Number(f.manejo || 0) },
    { label: 'Líquido', get: (f) => Number(f.liquido || 0) },
  ], data?.filas || [], { meta: [['Usuario', usuario], ['Póliza', data?.poliza?.nombre_poliza]] });

  return <div>
    <PageHeader title="Deatalles de los transportistas" description="Detalle por póliza: viajes, peso, flete, descuentos y líquido de cada transportista." />
    {message && <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>}
    <div className="toolbar" style={{ alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 320 }}><SearchableSelect label="Póliza" name="id_poliza" value={idPoliza} onChange={(v) => { setIdPoliza(v); setData(null); }} options={opciones} required placeholder="Buscar póliza..." /></div>
      <Button variant="primary" icon="🔍" onClick={generar} disabled={loading}>{loading ? 'Generando...' : 'Generar'}</Button>
      {data && <><Button variant="secondary" icon="📊" onClick={exportar} disabled={!data.filas?.length}>Excel</Button><Button variant="secondary" icon="🖨️" onClick={() => imprimirLiquidacionPorPoliza(data, usuario)} disabled={!data.filas?.length}>Imprimir / PDF</Button></>}
    </div>
    {loading ? <div className="card"><div className="card-body">Generando reporte...</div></div>
      : !data ? <div className="card"><div className="card-body" style={{ color: '#6b7280' }}>Seleccione una póliza y presione «Generar».</div></div>
        : <><div className="card" style={{ marginBottom: 14 }}><div className="card-body"><h3 style={{ margin: 0, fontSize: 14 }}>{data.poliza.nombre_poliza}</h3><div style={{ fontSize: 13, color: '#6b7280', marginTop: 5 }}>{formatNumber(t.transportistas, 0)} transportista(s) · {formatNumber(t.viajes, 0)} viaje(s) · <b>Líquido: {formatCurrency(t.liquido)}</b></div></div></div>
          <div className="table-wrapper"><div className="table-scroll"><table className="data-table"><thead><tr><th>No.</th><th>ID</th><th>Nombre propietario</th><th>Viajes</th><th>Peso qq</th><th>Flete</th><th>Anticipo</th><th>Diesel</th><th>Manejo</th><th>Líquido</th></tr></thead><tbody>{data.filas.length ? data.filas.map((f, i) => <tr key={f.id_transportista ?? `sin-${i}`}><td>{i + 1}</td><td>{f.nit || '—'}</td><td>{f.transportista}</td><td>{formatNumber(f.viajes, 0)}</td><td>{formatNumber(f.peso_qq)}</td><td>{formatNumber(f.flete)}</td><td>{formatNumber(f.anticipo)}</td><td>{formatNumber(f.diesel)}</td><td>{formatNumber(f.manejo)}</td><td style={{ fontWeight: 700, color: f.liquido < 0 ? '#c1121f' : undefined }}>{formatNumber(f.liquido)}</td></tr>) : <tr><td colSpan={10} style={{ textAlign: 'center', padding: 18 }}>Sin movimientos para esta póliza.</td></tr>}</tbody><tfoot><tr style={{ fontWeight: 700 }}><td>{formatNumber(t.transportistas, 0)}</td><td /><td>Total</td><td>{formatNumber(t.viajes, 0)}</td><td>{formatNumber(t.peso_qq)}</td><td>{formatNumber(t.flete)}</td><td>{formatNumber(t.anticipo)}</td><td>{formatNumber(t.diesel)}</td><td>{formatNumber(t.manejo)}</td><td style={{ color: t.liquido < 0 ? '#c1121f' : undefined }}>{formatNumber(t.liquido)}</td></tr></tfoot></table></div></div></>}
  </div>;
}
