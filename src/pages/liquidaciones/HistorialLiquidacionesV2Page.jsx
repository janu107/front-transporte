import { Fragment, useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import LiquidacionDetalleTable from '../../components/liquidaciones/LiquidacionDetalleTable';
import LiquidacionTabs from '../../components/liquidaciones/LiquidacionTabs';
import realApi from '../../api/realApi';
import useAuth from '../../hooks/useAuth';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { imprimirLiquidacionV2, imprimirResumenLiquidacionTransportista } from '../../utils/impresionDocs';

// El historial se consulta por LIQUIDACIÓN (número), no por transportista.
const VACIO = { num_liquidacion: '', estado: '', fecha_inicio: '', fecha_fin: '' };

export default function HistorialLiquidacionesV2Page() {
  const { user } = useAuth();
  const [filtros, setFiltros] = useState(VACIO);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detalle, setDetalle] = useState(null);
  const [detalleClave, setDetalleClave] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [imprimiendo, setImprimiendo] = useState(false);

  const cargar = useCallback(async (f = filtros) => {
    setLoading(true); setMessage(null);
    try {
      const params = Object.fromEntries(Object.entries(f).filter(([, value]) => value));
      setItems(await realApi.liquidacionV2Historial(params));
    } catch (e) { setMessage({ type: 'error', text: e?.userMessage || 'No se pudo cargar el historial.' }); }
    finally { setLoading(false); }
  }, [filtros]);

  useEffect(() => {
    cargar(VACIO);
    // La carga inicial no debe repetirse al editar filtros.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (name, value) => setFiltros((prev) => ({ ...prev, [name]: value }));

  const alternarDetalle = async (id, clave) => {
    if (detalleClave === clave) { setDetalle(null); setDetalleClave(null); return; }
    setDetalleLoading(true);
    try { setDetalle(await realApi.liquidacionV2Detalle(id)); setDetalleClave(clave); }
    catch (e) { setMessage({ type: 'error', text: e?.userMessage || 'No se pudo abrir el detalle.' }); }
    finally { setDetalleLoading(false); }
  };

  // Reporte de liquidaciones: documento "Liquidación a Transportistas" (una página
  // por transportista) de la liquidación seleccionada.
  const imprimirLiquidacion = async (idLiquidacion) => {
    setMessage(null);
    try {
      const datos = await realApi.liquidacionV2ReporteDetallado(idLiquidacion);
      imprimirLiquidacionV2(datos, user?.nombre || user?.usuario || '');
    } catch (e) {
      setMessage({ type: 'error', text: e?.userMessage || 'No se pudo generar el reporte de la liquidación.' });
    }
  };

  // Resumen por liquidación de transportista, con los filtros aplicados en pantalla.
  const imprimirResumen = async () => {
    setMessage(null); setImprimiendo(true);
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([, value]) => value));
      const datos = await realApi.liquidacionV2ResumenTransportista(params);
      if (!datos?.items?.length) {
        setMessage({ type: 'error', text: 'No hay liquidaciones activas para los filtros indicados.' });
        return;
      }
      imprimirResumenLiquidacionTransportista(datos, filtros, user?.nombre || user?.usuario || '');
    } catch (e) {
      setMessage({ type: 'error', text: e?.userMessage || 'No se pudo generar el resumen.' });
    } finally { setImprimiendo(false); }
  };

  return (
    <div>
      <PageHeader title="Historial de liquidaciones"
        description="Consulta liquidaciones activas y revertidas con su cadena de trazabilidad." />
      <LiquidacionTabs />
      {message && <div className="alert alert-error">{message.text}</div>}

      <div className="toolbar" style={{ alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        {/* Filtro principal: número de liquidación. */}
        <div style={{ minWidth: 220 }}>
          <Input label="N° de liquidación" name="histLiquidacion" value={filtros.num_liquidacion}
            placeholder="Ej. 202600010"
            onChange={(e) => setField('num_liquidacion', e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') cargar(); }} />
        </div>
        <Select label="Estado" name="histEstado" value={filtros.estado}
          onChange={(e) => setField('estado', e.target.value)}
          options={[{ value: 'LIQUIDADO', label: 'Liquidado' }, { value: 'REVERTIDA', label: 'Revertida' }]}
          placeholder="Todos" />
        <Input label="Desde" name="histDesde" type="date" value={filtros.fecha_inicio}
          onChange={(e) => setField('fecha_inicio', e.target.value)} />
        <Input label="Hasta" name="histHasta" type="date" min={filtros.fecha_inicio || undefined}
          value={filtros.fecha_fin} onChange={(e) => setField('fecha_fin', e.target.value)} />
        <Button variant="secondary" onClick={() => cargar()}>Aplicar filtros</Button>
        <Button variant="secondary" onClick={() => { setFiltros(VACIO); cargar(VACIO); }}>Limpiar</Button>
        {/* Reporte de resumen por liquidación de transportista (usa los filtros de arriba). */}
        <Button variant="primary" icon="📊" onClick={imprimirResumen} disabled={imprimiendo || !items.length}>
          {imprimiendo ? 'Generando...' : 'Resumen por transportista'}
        </Button>
      </div>

      <div className="table-wrapper table-wrapper--cards"><div className="table-scroll"><table className="data-table">
        <thead><tr><th>Número</th><th>Póliza</th><th>Transportista</th><th style={{ textAlign: 'right' }}>Total a pagar</th><th>Fecha</th><th>Estado</th><th>Trazabilidad</th><th>Detalle</th><th>Reporte</th></tr></thead>
        <tbody>{loading ? (
          <tr><td colSpan={9} style={{ textAlign: 'center', padding: 36 }}>Cargando...</td></tr>
        ) : items.length === 0 ? (
          <tr><td colSpan={9} style={{ textAlign: 'center', padding: 36, color: '#6b7280' }}>Sin liquidaciones para los filtros indicados.</td></tr>
        ) : items.map((row) => {
          const clave = `${row.id_liquidacion}-${row.id_transportista}`;
          const expandida = detalleClave === clave;
          const estado = Number(row.revertida) ? 'REVERTIDA' : (Number(row.valor_liquidacion) < 0 ? 'LIQUIDADO (SOBREGIRO)' : 'LIQUIDADO');
          return <Fragment key={clave}>
            <tr style={{ opacity: Number(row.revertida) ? 0.68 : 1 }}>
              <td>{row.num_liquidacion}</td><td>{row.nombre_poliza}</td>
              <td>{row.nombre_comercial}<div style={{ fontSize: 11, color: '#6b7280' }}>{row.nit}</div></td>
              <td style={{ textAlign: 'right', color: Number(row.valor_liquidacion) < 0 ? '#c1121f' : undefined }}>{formatCurrency(row.valor_liquidacion)}</td>
              <td>{formatDate(row.fecha_liquidacion)}</td><td><Badge value={estado} /></td>
              <td style={{ fontSize: 12 }}>{row.num_liquidacion_reemplazo
                ? `Reemplazada por ${row.num_liquidacion_reemplazo}`
                : row.num_liquidacion_origen ? `Reemplaza a ${row.num_liquidacion_origen}` : '—'}</td>
              <td><button type="button" style={linkButton} onClick={() => alternarDetalle(row.id_liquidacion, clave)}>
                {expandida ? 'Ocultar' : 'Ver desglose'}
              </button></td>
              {/* Reporte de liquidaciones: documento imprimible por transportista. */}
              <td><button type="button" style={linkButton} title="Imprimir liquidación a transportistas"
                onClick={() => imprimirLiquidacion(row.id_liquidacion)}>🖨️ Imprimir</button></td>
            </tr>
            {expandida && <tr><td colSpan={9} style={{ padding: 14, background: '#f8fafc' }}>
              {Number(row.revertida) && row.motivo_reversion && <div className="alert alert-error" style={{ marginTop: 0 }}>
                Motivo: {row.motivo_reversion} · {row.usuario_reversion || '—'} · {formatDate(row.fecha_reversion)}
              </div>}
              <LiquidacionDetalleTable items={detalle.transportistas || []} loading={detalleLoading} />
            </td></tr>}
          </Fragment>;
        })}</tbody>
      </table></div></div>
    </div>
  );
}

const linkButton = { border: 0, background: 'transparent', color: '#c1121f', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' };
