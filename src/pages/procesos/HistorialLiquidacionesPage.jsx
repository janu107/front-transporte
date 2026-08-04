/**
 * HistorialLiquidacionesPage.jsx — CONSULTA de liquidaciones (P16b), solo lectura.
 * Filtros (póliza, transportista, número, fecha) + botón Reimprimir liquidación.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import SearchableSelect from '../../components/common/SearchableSelect';
import Badge from '../../components/common/Badge';
import realApi from '../../api/realApi';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { imprimirLiquidacionResumen, imprimirLiquidacion } from '../../utils/impresionDocs';

export default function HistorialLiquidacionesPage() {
  const [items, setItems] = useState([]);
  const [polizas, setPolizas] = useState([]);
  const [transportistas, setTransportistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [f, setF] = useState({ id_poliza: '', id_transportista: '', num_liquidacion: '', fecha_ini: '', fecha_fin: '' });

  const notify = (type, text) => { setMessage({ type, text }); if (type !== 'error') setTimeout(() => setMessage(null), 6000); };

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
      setItems(await realApi.liquidacionHistorial(params));
    } catch (e) {
      notify('error', e?.userMessage || 'No se pudo cargar el historial.');
    } finally { setLoading(false); }
  }, [f]);

  useEffect(() => {
    (async () => {
      const [po, tr] = await Promise.all([realApi.list('polizas').catch(() => []), realApi.list('transportistas').catch(() => [])]);
      setPolizas(po); setTransportistas(tr);
    })();
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const polizaOptions = useMemo(() => polizas.map((p) => ({ value: p.codigo, label: p.nombre_poliza })), [polizas]);
  const transportistaOptions = useMemo(() => transportistas.map((t) => ({ value: t.codigo, label: t.nombre_comercial })), [transportistas]);

  const setField = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const limpiar = () => setF({ id_poliza: '', id_transportista: '', num_liquidacion: '', fecha_ini: '', fecha_fin: '' });

  // [2026-08 §9b] Reimprime el REPORTE DETALLADO de liquidación (el mismo que se
  // genera en la pantalla de Liquidaciones): detalle de viajes + descuentos + totales.
  const imprimirReporteDetallado = async (idPoliza) => {
    try {
      const datos = await realApi.liquidacionReporte(idPoliza);
      imprimirLiquidacion(datos, datos.usuario || '');
    } catch (e) {
      notify('error', e?.userMessage || e?.response?.data?.message || 'No se pudo generar el reporte de liquidación.');
    }
  };

  const reimprimir = async (idPoliza, nombrePoliza) => {
    try {
      // [v6 §5] Reimpresión = RESUMEN por póliza (una fila por transportista), como
      // estaba antes. Usa los valores ORIGINALES guardados en pro_liquidaciones.
      const d = await realApi.liquidacionDetalle(idPoliza);
      const trans = (d.transportistas || []).map((r) => ({
        nombre: r.nombre_comercial, nit: r.nit,
        cantidad_viajes: r.cantidad_viajes, valor_viajes: r.valor_viajes,
        valor_anticipos: r.valor_anticipos, valor_combustible: r.valor_vales,
        valor_aceite: r.valor_aceite, valor_administrativo: r.valor_administrativo,
        sobregiro_anterior: r.sobregiro_anterior, liquido: r.valor_liquidacion,
      }));
      const total = trans.reduce((s, t) => s + Number(t.liquido || 0), 0);
      imprimirLiquidacionResumen({
        poliza: nombrePoliza, fecha: d.poliza?.fecha_liquidacion,
        usuario: d.transportistas?.[0]?.usuario_graba || '',
        transportistas: trans, total_liquido: total,
      });
    } catch (e) {
      notify('error', e?.userMessage || 'No se pudo reimprimir.');
    }
  };

  return (
    <div>
      <PageHeader title="Historial de Liquidaciones" description="Consulta de liquidaciones confirmadas (solo lectura)." />
      {message && <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>}

      {/* Filtros */}
      <div className="toolbar" style={{ alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 220 }}>
          <SearchableSelect label="Póliza" name="id_poliza" value={f.id_poliza}
            onChange={(v) => setField('id_poliza', v)} options={polizaOptions} placeholder="Todas" />
        </div>
        <div style={{ minWidth: 220 }}>
          <SearchableSelect label="Transportista" name="id_transportista" value={f.id_transportista}
            onChange={(v) => setField('id_transportista', v)} options={transportistaOptions} placeholder="Todos" />
        </div>
        <Input label="N° liquidación" name="num_liquidacion" value={f.num_liquidacion} onChange={(e) => setField('num_liquidacion', e.target.value)} />
        <Input label="Desde" name="fecha_ini" type="date" value={f.fecha_ini} onChange={(e) => setField('fecha_ini', e.target.value)} />
        <Input label="Hasta" name="fecha_fin" type="date" value={f.fecha_fin} onChange={(e) => setField('fecha_fin', e.target.value)} />
        <Button variant="secondary" onClick={limpiar}>Limpiar</Button>
      </div>

      <div className="table-wrapper">
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr>
              <th>N° Liquidación</th><th>Póliza</th><th>NIT</th><th>Transportista</th>
              <th style={{ textAlign: 'right' }}>Líquido</th><th>Fecha</th><th>Usuario</th><th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40 }}>Cargando...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Sin liquidaciones.</td></tr>
              ) : items.map((r) => (
                <tr key={r.correlativo}>
                  <td>{r.num_liquidacion}</td>
                  <td>{r.nombre_poliza}</td>
                  <td>{r.nit}</td>
                  <td>{r.nombre_comercial}</td>
                  <td style={{ textAlign: 'right', color: Number(r.valor_liquidacion) < 0 ? '#c1121f' : undefined }}>{formatCurrency(r.valor_liquidacion)}</td>
                  <td>{formatDate(r.fecha_liquidacion)}</td>
                  <td>{r.usuario_graba || '-'}</td>
                  <td><Badge value={r.estado} /></td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}
                      title="Reimprimir liquidación (resumen por transportista)" onClick={() => reimprimir(r.id_poliza, r.nombre_poliza)}>🖨️</button>
                    {/* [2026-08 §9b] Reporte detallado de liquidación (igual al de la pantalla Liquidaciones). */}
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}
                      title="Reporte detallado de liquidación (viajes + descuentos + totales)" onClick={() => imprimirReporteDetallado(r.id_poliza)}>📄</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
        El botón imprime la liquidación completa de la póliza (todos sus transportistas). Solo lectura: no se puede editar desde aquí.
      </p>
    </div>
  );
}
