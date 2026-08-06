import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import SearchableSelect from '../../components/common/SearchableSelect';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LiquidacionDetalleTable from '../../components/liquidaciones/LiquidacionDetalleTable';
import realApi from '../../api/realApi';
import { formatCurrency } from '../../utils/formatters';

export default function GeneracionLiquidacionPage() {
  const [polizas, setPolizas] = useState([]);
  const [idPoliza, setIdPoliza] = useState('');
  const [vista, setVista] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState(null);

  const cargarPolizas = useCallback(async () => {
    try { setPolizas(await realApi.liquidacionV2Polizas()); }
    catch (e) { setMessage({ type: 'error', text: e?.userMessage || 'No se pudieron cargar las pólizas cerradas.' }); }
  }, []);

  useEffect(() => { cargarPolizas().finally(() => setLoading(false)); }, [cargarPolizas]);

  const options = useMemo(() => polizas.map((p) => ({
    value: p.codigo,
    label: `${p.nombre_poliza}${p.id_liq_origen ? ' · reliquidación' : ''}`,
  })), [polizas]);
  const seleccionada = polizas.find((p) => String(p.codigo) === String(idPoliza));

  const consultar = async () => {
    if (!idPoliza) return;
    setLoading(true); setMessage(null); setVista(null);
    try { setVista(await realApi.liquidacionV2VistaPrevia(idPoliza)); }
    catch (e) { setMessage({ type: 'error', text: e?.userMessage || 'No se pudo calcular la vista previa.' }); }
    finally { setLoading(false); }
  };

  const generar = async () => {
    setConfirmOpen(false); setGenerando(true); setMessage(null);
    try {
      const data = await realApi.liquidacionV2Generar({
        id_poliza: Number(idPoliza),
        id_liq_origen: seleccionada?.id_liq_origen || null,
      });
      setMessage({
        type: 'success',
        text: `Liquidación ${data.liquidacion?.num_liquidacion || ''} generada correctamente.`,
      });
      setIdPoliza(''); setVista(null);
      await cargarPolizas();
    } catch (e) {
      setMessage({ type: 'error', text: e?.userMessage || 'No se pudo generar la liquidación.' });
    } finally { setGenerando(false); }
  };

  const filas = vista?.transportistas || [];
  const total = filas.reduce((sum, row) => sum + Number(row.valor_liquidacion || 0), 0);

  return (
    <div>
      <PageHeader title="Generación de liquidación"
        description="Calcula y registra la liquidación de todos los transportistas de una póliza cerrada." />
      {message && <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>}

      <div className="toolbar" style={{ alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 320, flex: '0 1 520px' }}>
          <SearchableSelect label="Póliza cerrada sin liquidación activa" name="idPolizaLiquidacion"
            value={idPoliza} options={options}
            onChange={(value) => { setIdPoliza(value); setVista(null); setMessage(null); }}
            placeholder={options.length ? 'Escriba para buscar póliza...' : 'No hay pólizas disponibles'} />
        </div>
        <Button variant="secondary" icon="🔍" onClick={consultar} disabled={!idPoliza || loading}>
          {loading ? 'Calculando...' : 'Calcular vista previa'}
        </Button>
        <div className="spacer" />
        <Button variant="primary" icon="✅" onClick={() => setConfirmOpen(true)}
          disabled={!filas.length || generando}>
          {generando ? 'Generando...' : 'Generar liquidación'}
        </Button>
      </div>

      {seleccionada?.id_liq_origen && (
        <div className="alert alert-success">
          Esta póliza fue revertida anteriormente. La nueva liquidación conservará el enlace de trazabilidad.
        </div>
      )}

      <LiquidacionDetalleTable items={filas} loading={loading && Boolean(idPoliza)}
        emptyText={idPoliza ? 'Calcule la vista previa para revisar los montos.' : 'Seleccione una póliza cerrada.'} />

      {filas.length > 0 && (
        <div style={totalStyle}>
          <span>Total a pagar de la liquidación</span>
          <b style={{ color: total < 0 ? '#c1121f' : '#15803d', fontSize: 20 }}>{formatCurrency(total)}</b>
        </div>
      )}

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={generar}
        title="Generar liquidación" confirmText="Generar liquidación"
        message="¿Confirma los montos mostrados? Se aplicarán los vales y anticipos incluidos, se actualizará el sobregiro y la póliza quedará LIQUIDADA." />
    </div>
  );
}

const totalStyle = {
  display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 18,
  marginTop: 12, padding: '12px 16px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8,
};
