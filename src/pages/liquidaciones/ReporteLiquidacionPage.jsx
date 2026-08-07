/**
 * ReporteLiquidacionPage.jsx
 * Genera el documento "Liquidación a Transportistas": se elige una liquidación
 * y se obtiene el reporte con el detalle de viajes, descuentos y totales de
 * cada transportista (una página por transportista).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import SearchableSelect from '../../components/common/SearchableSelect';
import Badge from '../../components/common/Badge';
import LiquidacionTabs from '../../components/liquidaciones/LiquidacionTabs';
import realApi from '../../api/realApi';
import useAuth from '../../hooks/useAuth';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';
import { imprimirLiquidacionV2 } from '../../utils/impresionDocs';

export default function ReporteLiquidacionPage() {
  const { user } = useAuth();
  const [busqueda, setBusqueda] = useState('');
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [idLiquidacion, setIdLiquidacion] = useState('');
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [message, setMessage] = useState(null);

  // Se listan las liquidaciones existentes (una entrada por liquidación).
  const cargar = useCallback(async (num = '') => {
    setCargando(true);
    try {
      const filas = await realApi.liquidacionV2Historial(num ? { num_liquidacion: num } : {});
      const unicas = new Map();
      filas.forEach((f) => {
        if (!unicas.has(f.id_liquidacion)) {
          unicas.set(f.id_liquidacion, {
            id_liquidacion: f.id_liquidacion,
            num_liquidacion: f.num_liquidacion,
            nombre_poliza: f.nombre_poliza,
            fecha_liquidacion: f.fecha_liquidacion,
            revertida: f.revertida,
            transportistas: 0,
            total: 0,
          });
        }
        const item = unicas.get(f.id_liquidacion);
        item.transportistas += 1;
        item.total += Number(f.valor_liquidacion || 0);
      });
      setLiquidaciones([...unicas.values()]);
    } catch (e) {
      setMessage({ type: 'error', text: e?.userMessage || 'No se pudieron cargar las liquidaciones.' });
    } finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const options = useMemo(() => liquidaciones.map((l) => ({
    value: l.id_liquidacion,
    label: `${l.num_liquidacion} — ${l.nombre_poliza}${Number(l.revertida) ? ' (revertida)' : ''}`,
  })), [liquidaciones]);

  const seleccionada = liquidaciones.find((l) => String(l.id_liquidacion) === String(idLiquidacion));

  const generar = async (id = idLiquidacion) => {
    if (!id) return;
    setGenerando(true); setMessage(null);
    try {
      const datos = await realApi.liquidacionV2ReporteDetallado(id);
      setReporte(datos);
      imprimirLiquidacionV2(datos, user?.nombre || user?.usuario || '');
    } catch (e) {
      setMessage({ type: 'error', text: e?.userMessage || 'No se pudo generar el reporte.' });
    } finally { setGenerando(false); }
  };

  return (
    <div>
      <PageHeader title="Reporte de Liquidación"
        description="Genera el documento de liquidación a transportistas, con el detalle de viajes, descuentos y totales." />
      <LiquidacionTabs />
      {message && <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>}

      <div className="toolbar" style={{ alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 200 }}>
          <Input label="Buscar por N° de liquidación" name="repBuscar" value={busqueda}
            placeholder="Ej. 202600010"
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') cargar(busqueda); }} />
        </div>
        <Button variant="secondary" icon="🔍" onClick={() => cargar(busqueda)} disabled={cargando}>
          {cargando ? 'Buscando...' : 'Buscar'}
        </Button>
        <div style={{ minWidth: 300, flex: '1 1 320px' }}>
          <SearchableSelect label="Liquidación" name="repLiquidacion"
            value={idLiquidacion} options={options}
            onChange={(v) => { setIdLiquidacion(v); setReporte(null); setMessage(null); }}
            placeholder={options.length ? 'Seleccione la liquidación...' : 'No hay liquidaciones registradas'} />
        </div>
        <Button variant="primary" icon="📄" onClick={() => generar()} disabled={!idLiquidacion || generando}>
          {generando ? 'Generando...' : 'Generar reporte'}
        </Button>
      </div>

      {seleccionada && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body" style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
            <Resumen etiqueta="Liquidación" valor={seleccionada.num_liquidacion} />
            <Resumen etiqueta="Póliza" valor={seleccionada.nombre_poliza} />
            <Resumen etiqueta="Fecha" valor={formatDate(seleccionada.fecha_liquidacion)} />
            <Resumen etiqueta="Transportistas" valor={formatNumber(seleccionada.transportistas, 0)} />
            <Resumen etiqueta="Total a pagar" valor={formatCurrency(seleccionada.total)} />
            <Badge value={Number(seleccionada.revertida) ? 'REVERTIDA' : 'LIQUIDADO'} />
          </div>
        </div>
      )}

      {/* Listado de liquidaciones disponibles: genera el reporte con un clic. */}
      <div className="table-wrapper table-wrapper--cards">
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr>
              <th>N° Liquidación</th><th>Póliza</th><th>Fecha</th>
              <th style={{ textAlign: 'right' }}>Transportistas</th>
              <th style={{ textAlign: 'right' }}>Total a pagar</th>
              <th>Estado</th><th>Reporte</th>
            </tr></thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 36 }}>Cargando...</td></tr>
              ) : liquidaciones.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 36, color: '#6b7280' }}>
                  No hay liquidaciones registradas.
                </td></tr>
              ) : liquidaciones.map((l) => (
                <tr key={l.id_liquidacion} style={{ opacity: Number(l.revertida) ? 0.68 : 1 }}>
                  <td data-label="N° Liquidación">{l.num_liquidacion}</td>
                  <td data-label="Póliza">{l.nombre_poliza}</td>
                  <td data-label="Fecha">{formatDate(l.fecha_liquidacion)}</td>
                  <td data-label="Transportistas" style={{ textAlign: 'right' }}>{formatNumber(l.transportistas, 0)}</td>
                  <td data-label="Total a pagar" style={{ textAlign: 'right' }}>{formatCurrency(l.total)}</td>
                  <td data-label="Estado"><Badge value={Number(l.revertida) ? 'REVERTIDA' : 'LIQUIDADO'} /></td>
                  <td className="col-actions">
                    <Button variant="secondary" size="sm" icon="📄"
                      onClick={() => { setIdLiquidacion(l.id_liquidacion); generar(l.id_liquidacion); }}>
                      Generar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {reporte && (
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 10 }}>
          El reporte se abrió en la vista previa: {reporte.transportistas?.length || 0} página(s),
          una por transportista. Desde ahí puede imprimirlo o abrirlo en otra pestaña.
        </p>
      )}
    </div>
  );
}

function Resumen({ etiqueta, valor }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#6b7280' }}>{etiqueta}</div>
      <div style={{ fontWeight: 700 }}>{valor}</div>
    </div>
  );
}
