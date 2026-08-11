import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import SearchableSelect from '../../components/common/SearchableSelect';
import Badge from '../../components/common/Badge';
import LiquidacionTabs from '../../components/liquidaciones/LiquidacionTabs';
import realApi from '../../api/realApi';
import useAuth from '../../hooks/useAuth';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';
import { imprimirReporteLiquidacionesV2 } from '../../utils/impresionDocs';
import { exportarExcel } from '../../utils/excel';

const VACIO = { fecha_inicio: '', fecha_fin: '', id_transportista: '', id_poliza: '', estado: '' };

export default function ReporteLiquidacionesV2Page() {
  const { user } = useAuth();
  const [filtros, setFiltros] = useState(VACIO);
  const [transportistas, setTransportistas] = useState([]);
  const [polizas, setPolizas] = useState([]);
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    Promise.all([realApi.list('transportistas'), realApi.list('polizas')])
      .then(([tr, po]) => { setTransportistas(tr); setPolizas(po); })
      .catch(() => setMessage({ type: 'error', text: 'No se pudieron cargar los catálogos del reporte.' }));
  }, []);

  const transportistaOptions = useMemo(() => transportistas.map((t) => ({ value: t.codigo, label: t.nombre_comercial })), [transportistas]);
  const polizaOptions = useMemo(() => polizas.map((p) => ({ value: p.codigo, label: p.nombre_poliza })), [polizas]);
  const setField = (name, value) => setFiltros((prev) => ({ ...prev, [name]: value }));

  const consultar = async () => {
    if (filtros.fecha_inicio && filtros.fecha_fin && filtros.fecha_inicio > filtros.fecha_fin) {
      setMessage({ type: 'error', text: 'La fecha de inicio no puede ser posterior a la fecha final.' });
      return;
    }
    setLoading(true); setMessage(null);
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([, value]) => value));
      setReporte(await realApi.liquidacionV2Reporte(params));
    } catch (e) { setMessage({ type: 'error', text: e?.userMessage || 'No se pudo generar el reporte.' }); }
    finally { setLoading(false); }
  };

  const imprimir = () => {
    if (!reporte?.items?.length) return;
    imprimirReporteLiquidacionesV2(reporte, filtros, user?.nombre || user?.usuario || '');
  };

  // [V9 §6]
  const exportar = () => {
    if (!reporte?.items?.length) return;
    exportarExcel('Reporte de Liquidaciones', [
      { label: 'Liquidación', get: (r) => r.num_liquidacion },
      { label: 'Fecha', get: (r) => formatDate(r.fecha_liquidacion) },
      { label: 'Transportista', get: (r) => r.nombre_comercial },
      { label: 'NIT', get: (r) => r.nit },
      { label: 'Póliza', get: (r) => r.nombre_poliza },
      { label: 'Viajes', get: (r) => Number(r.cantidad_viajes || 0) },
      { label: 'Diesel', get: (r) => Number(r.valor_diesel || 0) },
      { label: 'Anticipos', get: (r) => Number(r.valor_anticipos || 0) },
      { label: 'Impuesto', get: (r) => Number(r.valor_impuesto || 0) },
      { label: 'Total a pagar', get: (r) => Number(r.valor_liquidacion || 0) },
      { label: 'Estado', get: (r) => (Number(r.revertida) ? 'REVERTIDA' : 'LIQUIDADO') },
    ], reporte.items, {
      meta: [['Usuario', user?.nombre || user?.usuario || ''],
        ['Período', [filtros.fecha_inicio, filtros.fecha_fin].filter(Boolean).join(' al ')],
        ['Total efectivo', reporte.totales?.total_pagar],
        ['Sobregiros generados', reporte.totales?.sobregiros_generados]],
    });
  };

  const items = reporte?.items || [];
  return (
    <div>
      <PageHeader title="Reporte de liquidaciones"
        description="Reporte imprimible por período, transportista, póliza y estado." />
      <LiquidacionTabs />
      {message && <div className="alert alert-error">{message.text}</div>}

      <div className="toolbar" style={{ alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <Input label="Desde" name="reporteLiqDesde" type="date" value={filtros.fecha_inicio}
          onChange={(e) => setField('fecha_inicio', e.target.value)} />
        <Input label="Hasta" name="reporteLiqHasta" type="date" min={filtros.fecha_inicio || undefined}
          value={filtros.fecha_fin} onChange={(e) => setField('fecha_fin', e.target.value)} />
        <div style={{ minWidth: 220 }}><SearchableSelect label="Transportista" name="reporteLiqTransportista"
          value={filtros.id_transportista} onChange={(v) => setField('id_transportista', v)}
          options={transportistaOptions} placeholder="Todos" /></div>
        <div style={{ minWidth: 220 }}><SearchableSelect label="Póliza" name="reporteLiqPoliza"
          value={filtros.id_poliza} onChange={(v) => setField('id_poliza', v)}
          options={polizaOptions} placeholder="Todas" /></div>
        <Select label="Estado" name="reporteLiqEstado" value={filtros.estado}
          onChange={(e) => setField('estado', e.target.value)} placeholder="Todos"
          options={[{ value: 'LIQUIDADO', label: 'Liquidado' }, { value: 'REVERTIDA', label: 'Revertida' }]} />
        <Button variant="secondary" icon="🔍" onClick={consultar} disabled={loading}>{loading ? 'Consultando...' : 'Consultar'}</Button>
        <Button variant="secondary" icon="📊" onClick={exportar} disabled={!items.length}>Exportar Excel</Button>
        <Button variant="primary" icon="🖨️" onClick={imprimir} disabled={!items.length}>Exportar PDF</Button>
      </div>

      <div className="table-wrapper table-wrapper--cards"><div className="table-scroll"><table className="data-table">
        <thead><tr><th>Liquidación</th><th>Fecha</th><th>Transportista</th><th>Póliza</th><th style={{ textAlign: 'right' }}>Viajes</th><th style={{ textAlign: 'right' }}>Diesel</th><th style={{ textAlign: 'right' }}>Anticipos</th><th style={{ textAlign: 'right' }}>Impuesto</th><th style={{ textAlign: 'right' }}>Total a pagar</th><th>Estado</th></tr></thead>
        <tbody>{loading ? <tr><td colSpan={10} style={{ textAlign: 'center', padding: 36 }}>Generando reporte...</td></tr>
          : reporte === null ? <tr><td colSpan={10} style={{ textAlign: 'center', padding: 36, color: '#6b7280' }}>Seleccione los filtros y presione «Consultar».</td></tr>
          : items.length === 0 ? <tr><td colSpan={10} style={{ textAlign: 'center', padding: 36, color: '#6b7280' }}>Sin resultados.</td></tr>
          : items.map((row) => <tr key={`${row.id_liquidacion}-${row.id_transportista}`} style={{ opacity: Number(row.revertida) ? 0.68 : 1 }}>
            <td>{row.num_liquidacion}</td><td>{formatDate(row.fecha_liquidacion)}</td><td>{row.nombre_comercial}</td><td>{row.nombre_poliza}</td>
            <td style={{ textAlign: 'right' }}>{formatNumber(row.cantidad_viajes, 0)}</td>
            <td style={{ textAlign: 'right' }}>{formatCurrency(row.valor_diesel)}</td>
            <td style={{ textAlign: 'right' }}>{formatCurrency(row.valor_anticipos)}</td>
            <td style={{ textAlign: 'right' }}>{formatCurrency(row.valor_impuesto)}</td>
            <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(row.valor_liquidacion)}</td>
            <td><Badge value={Number(row.revertida) ? 'REVERTIDA' : 'LIQUIDADO'} /></td>
          </tr>)}</tbody>
        {items.length > 0 && <tfoot><tr style={{ fontWeight: 700 }}><td colSpan={8} style={{ textAlign: 'right' }}>Total efectivo</td><td style={{ textAlign: 'right' }}>{formatCurrency(reporte.totales.total_pagar)}</td><td /></tr>
          <tr style={{ fontWeight: 700 }}><td colSpan={8} style={{ textAlign: 'right' }}>Sobregiros generados</td><td style={{ textAlign: 'right' }}>{formatCurrency(reporte.totales.sobregiros_generados)}</td><td /></tr></tfoot>}
      </table></div></div>
    </div>
  );
}
