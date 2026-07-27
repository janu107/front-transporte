/**
 * ReporteDieselPage.jsx — REPORTE DE DIESEL POR FACTURA (P18).
 * Filtros (tipo, valor, estado póliza, rango de fechas) → reporte agrupado por
 * factura con detalle de vales. Filas de póliza LIQUIDADA en gris (badge LIQ),
 * ACTIVA en blanco (badge ACT). Botón Imprimir.
 */
import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import SearchableSelect from '../../components/common/SearchableSelect';
import realApi from '../../api/realApi';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import { imprimirReporteDiesel } from '../../utils/impresionDocs';

const TIPO_OPTIONS = [
  { value: 'TODO', label: 'Todos' },
  { value: 'POLIZA', label: 'Por póliza' },
  { value: 'TRANSPORTISTA', label: 'Por transportista' },
];
const ESTADO_OPTIONS = [
  { value: 'AMBAS', label: 'Ambas' },
  { value: 'ACTIVA', label: 'Activa (abierta)' },
  { value: 'LIQUIDADA', label: 'Liquidada' },
];

export default function ReporteDieselPage() {
  const [f, setF] = useState({ tipo: 'TODO', valor: '', estado_poliza: 'AMBAS', fecha_ini: '', fecha_fin: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [polizas, setPolizas] = useState([]);
  const [transportistas, setTransportistas] = useState([]);

  useEffect(() => {
    (async () => {
      const [po, tr] = await Promise.all([realApi.list('polizas').catch(() => []), realApi.list('transportistas').catch(() => [])]);
      setPolizas(po); setTransportistas(tr);
    })();
  }, []);

  const setField = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const valorOptions = useMemo(() => {
    if (f.tipo === 'POLIZA') return polizas.map((p) => ({ value: p.nombre_poliza, label: p.nombre_poliza }));
    if (f.tipo === 'TRANSPORTISTA') return transportistas.map((t) => ({ value: t.codigo, label: t.nombre_comercial }));
    return [];
  }, [f.tipo, polizas, transportistas]);

  const generar = async () => {
    setMessage(null);
    if (!f.fecha_ini || !f.fecha_fin) { setMessage({ type: 'error', text: 'Las fechas inicial y final son obligatorias.' }); return; }
    if (f.fecha_ini > f.fecha_fin) { setMessage({ type: 'error', text: 'La fecha inicial no puede ser posterior a la final.' }); return; }
    if (f.tipo !== 'TODO' && !f.valor) { setMessage({ type: 'error', text: 'Indique el valor del filtro seleccionado.' }); return; }
    setLoading(true);
    try {
      const params = { tipo: f.tipo, estado_poliza: f.estado_poliza, fecha_ini: f.fecha_ini, fecha_fin: f.fecha_fin };
      if (f.tipo !== 'TODO') params.valor = f.valor;
      setData(await realApi.reporteDiesel(params));
    } catch (e) {
      setData(null);
      setMessage({ type: 'error', text: e?.userMessage || e?.response?.data?.message || 'No se pudo generar el reporte.' });
    } finally { setLoading(false); }
  };

  const detalleDe = (idFactura) => (data?.detalle || []).filter((d) => d.id_factura === idFactura);

  return (
    <div>
      <PageHeader title="Reporte de Diesel por Factura" description="Vales de combustible agrupados por factura de compra." />
      {message && <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>}

      {/* Filtros */}
      <div className="toolbar" style={{ alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 170 }}>
          <Select label="Tipo" name="tipo" value={f.tipo} onChange={(e) => setField('tipo', e.target.value) || setField('valor', '')} options={TIPO_OPTIONS} />
        </div>
        {f.tipo !== 'TODO' && (
          <div style={{ minWidth: 220 }}>
            <SearchableSelect label={f.tipo === 'POLIZA' ? 'Póliza' : 'Transportista'} name="valor" value={f.valor}
              onChange={(v) => setField('valor', v)} options={valorOptions} placeholder="Buscar..." />
          </div>
        )}
        <div style={{ minWidth: 170 }}>
          <Select label="Estado póliza" name="estado_poliza" value={f.estado_poliza} onChange={(e) => setField('estado_poliza', e.target.value)} options={ESTADO_OPTIONS} />
        </div>
        <Input label="Desde" name="fecha_ini" type="date" value={f.fecha_ini} onChange={(e) => setField('fecha_ini', e.target.value)} />
        <Input label="Hasta" name="fecha_fin" type="date" value={f.fecha_fin} onChange={(e) => setField('fecha_fin', e.target.value)} />
        <Button variant="primary" icon="🔍" onClick={generar} disabled={loading}>{loading ? 'Generando...' : 'Generar'}</Button>
        {data && <Button variant="secondary" icon="🖨️" onClick={() => imprimirReporteDiesel(data, f)}>Imprimir</Button>}
      </div>

      {/* Leyenda */}
      {data && (
        <div style={{ display: 'flex', gap: 16, fontSize: 12, margin: '4px 0 12px', color: '#374151' }}>
          <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#15803d', borderRadius: 3, marginRight: 4 }} /> ACT (póliza activa)</span>
          <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#888', borderRadius: 3, marginRight: 4 }} /> LIQ (póliza liquidada)</span>
        </div>
      )}

      {/* Reporte */}
      {loading ? (
        <div className="card"><div className="card-body">Generando reporte...</div></div>
      ) : !data ? (
        <div className="card"><div className="card-body" style={{ color: '#6b7280' }}>Configure los filtros y presione «Generar».</div></div>
      ) : data.facturas.length === 0 ? (
        <div className="card"><div className="card-body" style={{ color: '#6b7280' }}>No hay vales para el filtro seleccionado.</div></div>
      ) : (
        <>
          {data.facturas.map((fac) => (
            <div className="table-wrapper" key={fac.id_factura} style={{ marginBottom: 14 }}>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr style={{ background: '#1f3d5c' }}>
                      <th colSpan={8} style={{ color: '#fff' }}>
                        Factura {fac.num_factura} · {fac.producto} · comprados {formatNumber(fac.galones_comprados)} · precio {formatCurrency(fac.precio_galon)} · saldo {formatNumber(fac.saldo)} · despachados {formatNumber(fac.galones_despachados)} · total {formatCurrency(fac.total_valor)}
                      </th>
                    </tr>
                    <tr>
                      <th>Vale</th><th>Fecha</th><th>Transportista</th><th>Placa</th><th>Póliza</th><th>Estado</th>
                      <th style={{ textAlign: 'right' }}>Galones</th><th style={{ textAlign: 'right' }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalleDe(fac.id_factura).map((d) => {
                      const liq = d.estado_poliza === 'LIQUIDADA';
                      return (
                        <tr key={d.id_detalle} style={{ background: liq ? '#e5e7eb' : undefined, color: liq ? '#555' : undefined }}>
                          <td>{d.num_vale}</td>
                          <td>{formatDate(d.fecha_vale)}</td>
                          <td>{d.transportista}</td>
                          <td>{d.placa}</td>
                          <td>{d.poliza}</td>
                          <td><span className="badge" style={{ background: liq ? '#888' : '#15803d', color: '#fff' }}>{liq ? 'LIQ' : 'ACT'}</span></td>
                          <td style={{ textAlign: 'right' }}>{formatNumber(d.galones)}</td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(d.valor)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <div className="card"><div className="card-body" style={{ display: 'flex', gap: 24, fontWeight: 700 }}>
            <span>Facturas: {data.totales.total_facturas}</span>
            <span>Galones: {formatNumber(data.totales.total_galones)}</span>
            <span>Total: {formatCurrency(data.totales.total_valor_general)}</span>
          </div></div>
        </>
      )}
    </div>
  );
}
