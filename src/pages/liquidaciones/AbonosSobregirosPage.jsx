import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import SearchableSelect from '../../components/common/SearchableSelect';
import Badge from '../../components/common/Badge';
import LiquidacionTabs from '../../components/liquidaciones/LiquidacionTabs';
import realApi from '../../api/realApi';
import { formatCurrency, formatDate } from '../../utils/formatters';

function hoyLocal() {
  const ahora = new Date();
  return new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export default function AbonosSobregirosPage() {
  const [sobregiros, setSobregiros] = useState([]);
  const [idTransportista, setIdTransportista] = useState('');
  const [abonos, setAbonos] = useState([]);
  const [form, setForm] = useState({ fecha: hoyLocal(), monto: '', forma_pago: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const cargar = useCallback(async () => {
    try { setSobregiros(await realApi.liquidacionV2Sobregiros()); }
    catch (e) { setMessage({ type: 'error', text: e?.userMessage || 'No se pudieron cargar los sobregiros.' }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const seleccionado = sobregiros.find((row) => String(row.id_transportista) === String(idTransportista));
  const options = useMemo(() => sobregiros.map((row) => ({
    value: row.id_transportista,
    label: `${row.nombre_comercial} · saldo ${formatCurrency(row.saldo_pendiente)}`,
  })), [sobregiros]);

  const seleccionar = async (value) => {
    setIdTransportista(value); setAbonos([]); setMessage(null);
    setForm({ fecha: hoyLocal(), monto: '', forma_pago: '' });
    if (!value) return;
    try { setAbonos(await realApi.liquidacionV2Abonos(value)); }
    catch (e) { setMessage({ type: 'error', text: e?.userMessage || 'No se pudo cargar el historial de abonos.' }); }
  };

  const monto = Number(form.monto);
  const saldo = Number(seleccionado?.saldo_pendiente || 0);
  const valido = seleccionado && form.fecha && form.forma_pago && Number.isFinite(monto) && monto > 0 && monto <= saldo;

  const registrar = async () => {
    if (!valido || saving) return;
    setSaving(true); setMessage(null);
    try {
      await realApi.liquidacionV2RegistrarAbono({
        id_transportista: Number(idTransportista), fecha: form.fecha,
        monto, forma_pago: form.forma_pago,
      });
      setMessage({ type: 'success', text: 'Abono registrado y saldo actualizado correctamente.' });
      await cargar();
      setAbonos(await realApi.liquidacionV2Abonos(idTransportista));
      setForm({ fecha: hoyLocal(), monto: '', forma_pago: '' });
    } catch (e) { setMessage({ type: 'error', text: e?.userMessage || 'No se pudo registrar el abono.' }); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="Abonos y sobregiros"
        description="Registra pagos de transportistas y consulta el saldo negativo consolidado." />
      <LiquidacionTabs />
      {message && <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>}

      <div style={panelStyle}>
        <div style={{ minWidth: 300, flex: '1 1 420px' }}>
          <SearchableSelect label="Transportista con sobregiro" name="sobregiroTransportista"
            value={idTransportista} onChange={seleccionar} options={options}
            placeholder={options.length ? 'Escriba para buscar...' : 'No hay sobregiros registrados'} />
        </div>
        {seleccionado && <div style={saldoStyle}>
          <span>Saldo pendiente</span><b>{formatCurrency(seleccionado.saldo_pendiente)}</b>
          <Badge value={seleccionado.estado} />
        </div>}
      </div>

      <div className="form-grid" style={{ alignItems: 'flex-end', margin: '14px 0' }}>
        <Input label="Fecha" name="fechaAbono" type="date" required value={form.fecha}
          onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))} disabled={!seleccionado || saldo <= 0} />
        <Input label="Monto" name="montoAbono" type="number" min="0.01" step="0.01" max={saldo || undefined}
          required value={form.monto} onChange={(e) => setForm((p) => ({ ...p, monto: e.target.value }))}
          error={form.monto && (monto <= 0 || monto > saldo) ? `Debe estar entre Q0.01 y ${formatCurrency(saldo)}` : undefined}
          disabled={!seleccionado || saldo <= 0} />
        <Select label="Forma de pago" name="formaPagoAbono" required value={form.forma_pago}
          onChange={(e) => setForm((p) => ({ ...p, forma_pago: e.target.value }))}
          options={[{ value: 'EFECTIVO', label: 'Efectivo' }, { value: 'TRANSFERENCIA', label: 'Transferencia' }, { value: 'DEPOSITO', label: 'Depósito' }, { value: 'CHEQUE', label: 'Cheque' }]}
          disabled={!seleccionado || saldo <= 0} />
        <Button variant="primary" onClick={registrar} disabled={!valido || saving}>
          {saving ? 'Registrando...' : 'Registrar abono'}
        </Button>
      </div>

      <h4 style={{ margin: '18px 0 8px' }}>Sobregiros por transportista</h4>
      <div className="table-wrapper table-wrapper--cards"><div className="table-scroll"><table className="data-table">
        <thead><tr><th>Transportista</th><th style={{ textAlign: 'right' }}>Sobregiro total</th><th style={{ textAlign: 'right' }}>Abonado</th><th style={{ textAlign: 'right' }}>Saldo pendiente</th><th>Estado</th></tr></thead>
        <tbody>{loading ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32 }}>Cargando...</td></tr>
          : sobregiros.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>No hay sobregiros.</td></tr>
          : sobregiros.map((row) => <tr key={row.id_transportista} onClick={() => seleccionar(row.id_transportista)}
            style={{ cursor: 'pointer', background: String(row.id_transportista) === String(idTransportista) ? 'rgba(193,18,31,0.08)' : undefined }}>
            <td>{row.nombre_comercial}<div style={{ fontSize: 11, color: '#6b7280' }}>{row.nit}</div></td>
            <td style={{ textAlign: 'right' }}>{formatCurrency(row.sobregiro_total)}</td>
            <td style={{ textAlign: 'right' }}>{formatCurrency(row.total_abonado)}</td>
            <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(row.saldo_pendiente)}</td>
            <td><Badge value={row.estado} /></td>
          </tr>)}</tbody>
      </table></div></div>

      {idTransportista && <>
        <h4 style={{ margin: '18px 0 8px' }}>Historial de abonos</h4>
        <div className="table-wrapper"><div className="table-scroll"><table className="data-table">
          <thead><tr><th>Fecha</th><th style={{ textAlign: 'right' }}>Monto</th><th>Forma de pago</th><th>Referencia</th><th>Usuario</th></tr></thead>
          <tbody>{abonos.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#6b7280' }}>Sin abonos registrados.</td></tr>
            : abonos.map((row) => <tr key={row.correlativo}><td>{formatDate(row.fecha)}</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(row.monto)}</td><td>{row.forma_pago}</td>
              <td>{row.referencia || '—'}</td><td>{row.usuario_graba || '—'}</td></tr>)}</tbody>
        </table></div></div>
      </>}
    </div>
  );
}

const panelStyle = { display: 'flex', alignItems: 'flex-end', gap: 18, flexWrap: 'wrap', padding: 14, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8 };
const saldoStyle = { display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 7 };
