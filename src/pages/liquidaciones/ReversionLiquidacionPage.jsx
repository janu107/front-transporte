import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';
import Modal from '../../components/common/Modal';
import LiquidacionDetalleTable from '../../components/liquidaciones/LiquidacionDetalleTable';
import realApi from '../../api/realApi';
import useAuth from '../../hooks/useAuth';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function ReversionLiquidacionPage() {
  const { user } = useAuth();
  const [buscar, setBuscar] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detalle, setDetalle] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const esAdmin = String(user?.rol || '').toUpperCase() === 'ADMIN';

  const cargar = useCallback(async (term = '') => {
    setLoading(true);
    try { setItems(await realApi.liquidacionV2Reversibles(term)); }
    catch (e) { setMessage({ type: 'error', text: e?.userMessage || 'No se pudieron cargar las liquidaciones.' }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (esAdmin) cargar(); else setLoading(false); }, [cargar, esAdmin]);

  const abrir = async (id) => {
    setLoading(true); setMessage(null);
    try { setDetalle(await realApi.liquidacionV2Detalle(id)); setMotivo(''); }
    catch (e) { setMessage({ type: 'error', text: e?.userMessage || 'No se pudo cargar el detalle.' }); }
    finally { setLoading(false); }
  };

  const revertir = async () => {
    if (motivo.trim().length < 5 || saving) return;
    setSaving(true);
    try {
      await realApi.liquidacionV2Revertir(detalle.liquidacion.correlativo, motivo.trim());
      setDetalle(null); setMotivo('');
      setMessage({ type: 'success', text: 'Liquidación revertida; sus vales, anticipos y sobregiros fueron restaurados.' });
      await cargar(buscar);
    } catch (e) {
      setMessage({ type: 'error', text: e?.userMessage || 'No se pudo revertir la liquidación.' });
    } finally { setSaving(false); }
  };

  if (!esAdmin) {
    return <div><PageHeader title="Reversión de liquidación" />
      <div className="alert alert-error">Solo los usuarios administradores pueden revertir liquidaciones.</div></div>;
  }

  return (
    <div>
      <PageHeader title="Reversión de liquidación"
        description="Restaura una liquidación y conserva la trazabilidad del motivo y del usuario responsable." />
      {message && <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>}

      <div className="toolbar" style={{ gap: 10, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 280, maxWidth: 480, flex: '1 1 360px' }}>
          <SearchBar value={buscar} onChange={setBuscar}
            placeholder="Número, póliza o transportista..." />
        </div>
        <Button variant="secondary" icon="🔍" onClick={() => cargar(buscar)} disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar'}
        </Button>
      </div>

      <div className="table-wrapper table-wrapper--cards">
        <div className="table-scroll"><table className="data-table">
          <thead><tr><th>N° liquidación</th><th>Póliza</th><th>Fecha</th><th>Usuario</th><th style={{ textAlign: 'right' }}>Transportistas</th><th style={{ textAlign: 'right' }}>Total</th><th>Acción</th></tr></thead>
          <tbody>{loading ? (
            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 36 }}>Cargando...</td></tr>
          ) : items.length === 0 ? (
            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 36, color: '#6b7280' }}>No hay liquidaciones activas que coincidan.</td></tr>
          ) : items.map((row) => (
            <tr key={row.id_liquidacion}>
              <td>{row.num_liquidacion}</td><td>{row.nombre_poliza}</td><td>{formatDate(row.fecha_liquidacion)}</td>
              <td>{row.usuario_graba || '—'}</td><td style={{ textAlign: 'right' }}>{row.transportistas}</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(row.total_liquidacion)}</td>
              <td><Button variant="secondary" onClick={() => abrir(row.id_liquidacion)}>Revisar y revertir</Button></td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>

      <Modal isOpen={Boolean(detalle)} onClose={() => !saving && setDetalle(null)} size="lg"
        title={detalle ? `Revertir — ${detalle.liquidacion.num_liquidacion}` : 'Revertir liquidación'}
        footer={<><Button variant="secondary" onClick={() => setDetalle(null)} disabled={saving}>Cancelar</Button>
          <Button variant="primary" onClick={revertir} disabled={motivo.trim().length < 5 || saving}>
            {saving ? 'Revirtiendo...' : 'Confirmar reversión'}
          </Button></>}>
        {detalle && <>
          <div className="alert alert-error" style={{ marginTop: 0 }}>
            Esta acción liberará los vales y anticipos, restaurará los sobregiros afectados y dejará la póliza cerrada para reliquidarla.
          </div>
          <p style={{ fontSize: 13 }}><b>{detalle.liquidacion.nombre_poliza}</b> · Generada por {detalle.liquidacion.usuario_graba || '—'} el {formatDate(detalle.liquidacion.fecha_liquidacion)}</p>
          <LiquidacionDetalleTable items={detalle.transportistas || []} />
          <div className="form-field" style={{ marginTop: 14 }}>
            <label className="form-label" htmlFor="motivoReversion">Motivo de la reversión <span className="req">*</span></label>
            <textarea id="motivoReversion" className={`form-control ${motivo && motivo.trim().length < 5 ? 'is-invalid' : ''}`}
              rows={4} maxLength={500} value={motivo} onChange={(e) => setMotivo(e.target.value)}
              placeholder="Explique por qué se revierte esta liquidación..." />
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{motivo.length}/500 · mínimo 5 caracteres</div>
          </div>
        </>}
      </Modal>
    </div>
  );
}
