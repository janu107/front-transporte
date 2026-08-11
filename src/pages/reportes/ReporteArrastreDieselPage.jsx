/**
 * ReporteArrastreDieselPage.jsx — [2026-08 §9a] ARRASTRE DE DIESEL.
 * Reporte de diesel agrupado por factura, con dos parámetros:
 *   1) Estado de póliza: Activas (abiertas) / Liquidadas / Ambas.
 *   2) Factura: una factura específica (o todas).
 * Reutiliza el servicio y la impresión del "Reporte de Diesel por Factura".
 */
import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import SearchableSelect from '../../components/common/SearchableSelect';
import realApi from '../../api/realApi';
import useAuth from '../../hooks/useAuth';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import { imprimirReporteDiesel } from '../../utils/impresionDocs';
import { exportarExcel } from '../../utils/excel';

const ESTADO_OPTIONS = [
  { value: 'AMBAS', label: 'Ambas' },
  { value: 'ACTIVA', label: 'Activas (abiertas)' },
  { value: 'LIQUIDADA', label: 'Liquidadas' },
];

export default function ReporteArrastreDieselPage() {
  const { user } = useAuth();
  const [f, setF] = useState({ estado_poliza: 'AMBAS', factura: '' });
  const [facturas, setFacturas] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    (async () => { setFacturas(await realApi.list('facturasVales').catch(() => [])); })();
  }, []);

  const setField = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const facturaOptions = useMemo(
    () => facturas.map((x) => ({ value: x.codigo, label: `${x.factura || 's/f'}${x.descripcion_compra ? ` · ${x.descripcion_compra}` : ''}` })),
    [facturas]
  );

  const generar = async () => {
    setMessage(null);
    setLoading(true);
    try {
      const params = { estado_poliza: f.estado_poliza };
      if (f.factura) { params.tipo = 'FACTURA'; params.valor = f.factura; }
      else { params.tipo = 'TODO'; }
      setData(await realApi.reporteDiesel(params));
    } catch (e) {
      setData(null);
      setMessage({ type: 'error', text: e?.userMessage || e?.response?.data?.message || 'No se pudo generar el reporte.' });
    } finally { setLoading(false); }
  };

  const detalleDe = (idFactura) => (data?.detalle || []).filter((d) => d.id_factura === idFactura);

  // [V9 §6] Exportación del arrastre. Sin la columna de precio, igual que el
  // encabezado en pantalla y en la impresión.
  const exportar = () => {
    const porFactura = new Map((data?.facturas || []).map((x) => [x.id_factura, x]));
    const filas = (data?.detalle || []).map((d) => ({ ...d, fac: porFactura.get(d.id_factura) || {} }));
    exportarExcel('Arrastre de Diesel', [
      { label: 'Factura', get: (r) => r.fac.num_factura ?? '' },
      { label: 'Producto', get: (r) => r.fac.producto ?? '' },
      { label: 'Vale', get: (r) => r.num_vale },
      { label: 'Fecha', get: (r) => formatDate(r.fecha_vale) },
      { label: 'Transportista', get: (r) => r.transportista },
      { label: 'Placa', get: (r) => r.placa },
      { label: 'Póliza', get: (r) => r.poliza },
      { label: 'Estado póliza', get: (r) => r.estado_poliza },
      { label: 'Galones', get: (r) => Number(r.galones || 0) },
      { label: 'Valor', get: (r) => Number(r.valor || 0) },
    ], filas, {
      meta: [['Usuario', user?.nombre || user?.usuario || ''],
        ['Estado de póliza', f.estado_poliza],
        ['Galones', data?.totales?.total_galones], ['Total', data?.totales?.total_valor_general]],
    });
  };

  return (
    <div>
      <PageHeader title="Arrastre de Diesel" description="Diesel despachado agrupado por factura de compra (por estado de póliza y factura)." />
      {message && <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>}

      {/* Filtros: estado de póliza + factura */}
      <div className="toolbar" style={{ alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 200 }}>
          <Select label="Estado de póliza" name="estado_poliza" value={f.estado_poliza}
            onChange={(e) => setField('estado_poliza', e.target.value)} options={ESTADO_OPTIONS} />
        </div>
        <div style={{ minWidth: 260 }}>
          <SearchableSelect label="Factura" name="factura" value={f.factura}
            onChange={(v) => setField('factura', v)} options={facturaOptions} placeholder="Todas las facturas" />
        </div>
        <Button variant="primary" icon="🔍" onClick={generar} disabled={loading}>{loading ? 'Generando...' : 'Generar'}</Button>
        {data && <Button variant="secondary" icon="📊" onClick={exportar} disabled={!data.detalle?.length}>Exportar Excel</Button>}
        {/* El último parámetro oculta la columna Precio en el encabezado de factura. */}
        {data && <Button variant="secondary" icon="🖨️" onClick={() => imprimirReporteDiesel(data, f, user?.nombre || user?.usuario || '', true)}>Imprimir</Button>}
      </div>

      {/* Leyenda */}
      {data && (
        <div style={{ display: 'flex', gap: 16, fontSize: 12, margin: '4px 0 12px', color: '#374151' }}>
          <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#15803d', borderRadius: 3, marginRight: 4 }} /> ACT (póliza activa)</span>
          <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#888', borderRadius: 3, marginRight: 4 }} /> LIQ (póliza liquidada)</span>
        </div>
      )}

      {loading ? (
        <div className="card"><div className="card-body">Generando reporte...</div></div>
      ) : !data ? (
        <div className="card"><div className="card-body" style={{ color: '#6b7280' }}>Configure los filtros y presione «Generar».</div></div>
      ) : data.facturas.length === 0 ? (
        <div className="card"><div className="card-body" style={{ color: '#6b7280' }}>No hay vales de diesel para el filtro seleccionado.</div></div>
      ) : (
        <>
          {data.facturas.map((fac) => (
            <div className="table-wrapper" key={fac.id_factura} style={{ marginBottom: 14 }}>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr style={{ background: '#1f3d5c' }}>
                      {/* [V9 §2] El precio de compra del galón no se muestra en este reporte. */}
                      <th colSpan={8} style={{ color: '#fff' }}>
                        Factura {fac.num_factura} · {fac.producto} · comprados {formatNumber(fac.galones_comprados)} · saldo {formatNumber(fac.saldo)} · despachados {formatNumber(fac.galones_despachados)} · total {formatCurrency(fac.total_valor)}
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
