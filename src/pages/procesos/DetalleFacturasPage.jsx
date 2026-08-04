/**
 * DetalleFacturasPage.jsx — DETALLE DE FACTURA (P14) sobre pro_detalle_facturas.
 * Alta manual de vales de combustible contra una factura ACTIVA:
 * cascada Factura(activa+saldo) → Póliza(activa) → Placa → Transportista(auto) → Piloto,
 * cantidad ≤ saldo (validado en backend, transaccional), correlativo AÑO+00000,
 * total = cantidad × precio. Botones Guardar / Nuevo / Imprimir (vale combustible).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import SearchableSelect from '../../components/common/SearchableSelect';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import SearchBar from '../../components/common/SearchBar';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import TablePager from '../../components/common/TablePager';
import usePagination from '../../hooks/usePagination';
import realApi from '../../api/realApi';
import { lookup, formatDate, formatNumber, formatCurrency } from '../../utils/formatters';
import { imprimirValeCombustible } from '../../utils/impresionDocs';

const EMPTY = { id_factura_vale: '', id_poliza: '', id_camion: '', id_piloto: '', fecha: '', cantidad: '' };
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export default function DetalleFacturasPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const [facturas, setFacturas] = useState([]);
  const [polizas, setPolizas] = useState([]);
  const [camiones, setCamiones] = useState([]);
  const [transportistas, setTransportistas] = useState([]);
  const [pilotos, setPilotos] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [confirmRow, setConfirmRow] = useState(null);
  const [term, setTerm] = useState('');

  const notify = useCallback((type, text) => {
    setMessage({ type, text });
    if (type !== 'error') setTimeout(() => setMessage(null), 6000);
  }, []);

  const cargar = useCallback(async () => {
    try { setItems(await realApi.list('detalleFactura')); }
    catch (e) { notify('error', e?.userMessage || 'No se pudieron cargar los vales.'); }
  }, [notify]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [fa, po, ca, tr, pi] = await Promise.all([
        realApi.list('facturasVales').catch(() => []),
        realApi.list('polizas').catch(() => []),
        realApi.list('camiones').catch(() => []),
        realApi.list('transportistas').catch(() => []),
        realApi.list('pilotos').catch(() => []),
      ]);
      setFacturas(fa); setPolizas(po); setCamiones(ca); setTransportistas(tr); setPilotos(pi);
      await cargar();
      setLoading(false);
    })();
  }, [cargar]);

  // Opciones
  const facturaOptions = useMemo(
    () => facturas.filter((f) => String(f.estado).toUpperCase() === 'ACTIVO' && Number(f.saldo) > 0)
      .map((f) => ({ value: f.codigo, label: `${f.factura || 's/f'} · saldo ${formatNumber(f.saldo)} · Q${f.precio}` })),
    [facturas]
  );
  const polizaOptions = useMemo(
    () => polizas.filter((p) => String(p.estado).toUpperCase() === 'ABIERTA').map((p) => ({ value: p.codigo, label: p.nombre_poliza })),
    [polizas]
  );
  const camionOptions = useMemo(() => camiones.map((c) => ({ value: c.codigo, label: c.placa })), [camiones]);

  const facturaSel = facturas.find((f) => String(f.codigo) === String(values.id_factura_vale)) || null;
  const camionSel = useMemo(() => camiones.find((c) => String(c.codigo) === String(values.id_camion)) || null, [camiones, values.id_camion]);
  const transportistaSel = useMemo(
    () => (camionSel ? transportistas.find((t) => String(t.codigo) === String(camionSel.id_transportista)) || null : null),
    [camionSel, transportistas]
  );
  const pilotoOptions = useMemo(() => {
    if (!camionSel) return [];
    return pilotos.filter((p) => String(p.id_transportista) === String(camionSel.id_transportista))
      .map((p) => ({ value: p.codigo, label: `${p.licencia || 's/l'} — ${p.nombres} ${p.apellidos || ''}`.trim() }));
  }, [camionSel, pilotos]);

  const precio = facturaSel ? Number(facturaSel.precio || 0) : 0;
  const saldo = facturaSel ? Number(facturaSel.saldo || 0) : 0;
  const cantidad = num(values.cantidad);
  const total = Number((cantidad * precio).toFixed(2));

  const setField = (name, value) => { setValues((p) => ({ ...p, [name]: value })); setErrors((p) => ({ ...p, [name]: undefined })); };
  const onChangeCamion = (v) => { setValues((p) => ({ ...p, id_camion: v, id_piloto: '' })); setErrors((p) => ({ ...p, id_camion: undefined, id_piloto: undefined })); };

  const resetFormulario = () => { setValues(EMPTY); setErrors({}); setSaved(null); };
  const abrirNuevo = () => { resetFormulario(); setMessage(null); setModalOpen(true); };
  const cerrarModal = () => { setModalOpen(false); resetFormulario(); };

  const validar = () => {
    const e = {};
    if (!values.id_factura_vale) e.id_factura_vale = 'Seleccione una factura activa';
    if (!values.id_poliza) e.id_poliza = 'Seleccione una póliza';
    if (!values.id_camion) e.id_camion = 'Seleccione la placa';
    else if (!transportistaSel) e.id_camion = 'La placa no tiene transportista';
    if (!values.id_piloto) e.id_piloto = 'Seleccione el piloto';
    if (!values.fecha) e.fecha = 'La fecha es obligatoria';
    if (cantidad <= 0) e.cantidad = 'La cantidad debe ser mayor que cero';
    else if (facturaSel && cantidad > saldo) e.cantidad = `Supera el saldo de la factura (${formatNumber(saldo)})`;
    return e;
  };

  const guardar = async () => {
    const e = validar();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true); setMessage(null);
    try {
      const payload = { ...values, id_transportista: camionSel ? camionSel.id_transportista : null };
      const res = await realApi.create('detalleFactura', payload);
      setSaved(res); // [P14 i/j/k] no cierra el modal: se conserva para imprimir / Nuevo
      // refresca facturas para reflejar el saldo descontado
      realApi.list('facturasVales').then(setFacturas).catch(() => {});
      await cargar();
    } catch (err) {
      notify('error', err?.userMessage || err?.response?.data?.message || 'No se pudo guardar el vale.');
    } finally { setSaving(false); }
  };

  const anular = async () => {
    const row = confirmRow; setConfirmRow(null);
    try {
      await realApi.patchEstado('detalleFactura', row.correlativo, 'ANULADO');
      notify('success', 'Vale anulado (saldo restaurado).');
      realApi.list('facturasVales').then(setFacturas).catch(() => {});
      await cargar();
    } catch (err) { notify('error', err?.userMessage || err?.response?.data?.message || 'No se pudo anular.'); }
  };

  // [v5] La impresión ya no arma los datos localmente: los pide resueltos y
  // recalculados en servidor (GET /detalle-factura/:id/impresion), para no
  // confiar en el total mostrado en pantalla.
  const imprimirVale = async (correlativo) => {
    try {
      const datos = await realApi.detalleFacturaImpresion(correlativo);
      imprimirValeCombustible(datos);
    } catch (err) {
      notify('error', err?.userMessage || err?.response?.data?.message || 'No se pudo obtener el vale para imprimir.');
    }
  };

  const filtrados = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) => [
      r.num_vale, formatDate(r.fecha),
      lookup(facturas, r.id_factura_vale, 'codigo', 'factura'),
      lookup(polizas, r.id_poliza, 'codigo', 'nombre_poliza'),
      lookup(transportistas, r.id_transportista, 'codigo', 'nombre_comercial'),
      lookup(camiones, r.id_camion, 'codigo', 'placa'),
    ].some((c) => c != null && String(c).toLowerCase().includes(q)));
  }, [items, term, facturas, polizas, transportistas, camiones]);

  // [2026-08 §3] Paginación de 25 en 25 (del más nuevo al más antiguo).
  const pag = usePagination(filtrados, 25);

  return (
    <div>
      <PageHeader title="Detalle de Factura" description="Vales de combustible contra facturas activas." actionLabel="+ Nuevo vale" onAction={abrirNuevo} />
      {message && <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>}

      <div className="toolbar">
        <SearchBar value={term} onChange={setTerm} placeholder="Buscar por vale, factura, póliza, transportista, placa..." />
      </div>

      <div className="table-wrapper">
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr>
              <th>Corr.</th><th>N° Vale</th><th>Factura</th><th>Póliza</th><th>Transportista</th>
              <th>Placa</th><th>Fecha</th><th style={{ textAlign: 'right' }}>Cantidad</th>
              <th style={{ textAlign: 'right' }}>Total</th><th>Estado</th><th style={{ textAlign: 'right' }}>Acciones</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: 40 }}>Cargando...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Sin vales registrados.</td></tr>
              ) : pag.visibles.map((r) => (
                <tr key={r.correlativo}>
                  <td>{r.correlativo}</td>
                  <td>{r.num_vale}</td>
                  <td>{lookup(facturas, r.id_factura_vale, 'codigo', 'factura')}</td>
                  <td>{lookup(polizas, r.id_poliza, 'codigo', 'nombre_poliza')}</td>
                  <td>{lookup(transportistas, r.id_transportista, 'codigo', 'nombre_comercial')}</td>
                  <td>{lookup(camiones, r.id_camion, 'codigo', 'placa')}</td>
                  <td>{formatDate(r.fecha)}</td>
                  <td style={{ textAlign: 'right' }}>{formatNumber(r.cantidad)}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(r.total)}</td>
                  <td><Badge value={r.estado || 'ACTIVO'} /></td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button style={accionBtn} title="Imprimir vale" onClick={() => imprimirVale(r.correlativo)}>🖨️</button>
                    {String(r.estado).toUpperCase() !== 'ANULADO' && String(r.origen).toUpperCase() === 'M' && (
                      <button style={accionBtn} title="Anular" onClick={() => setConfirmRow(r)}>🚫</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePager {...pag} />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={cerrarModal}
        size="lg"
        title="Nuevo vale (detalle de factura)"
        footer={saved ? (
          <>
            <Button variant="secondary" onClick={cerrarModal}>Cerrar</Button>
            <Button variant="secondary" icon="🖨️" onClick={() => imprimirVale(saved.correlativo)}>Imprimir</Button>
            <Button variant="primary" icon="➕" onClick={resetFormulario}>Nuevo</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={cerrarModal} disabled={saving}>Cancelar</Button>
            <Button variant="primary" icon="💾" onClick={guardar} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
          </>
        )}
      >
        {saved && (
          <div className="alert alert-success" style={{ marginTop: 0, marginBottom: 12 }}>
            ✅ Vale guardado correctamente. Número asignado: <b>{saved.num_vale}</b>. Puede imprimir o presionar «Nuevo».
          </div>
        )}
        <div className="form-grid">
          <ReadOnly label="Número de vale" value={saved ? saved.num_vale : '(se asigna al guardar)'} />
          <SearchableSelect label="Factura / vale (activa)" name="id_factura_vale" required value={values.id_factura_vale}
            onChange={(v) => setField('id_factura_vale', v)} options={facturaOptions} error={errors.id_factura_vale}
            placeholder="Buscar factura (número, saldo)..." />
          <SearchableSelect label="Póliza (activa)" name="id_poliza" required value={values.id_poliza}
            onChange={(v) => setField('id_poliza', v)} options={polizaOptions} error={errors.id_poliza}
            placeholder="Buscar póliza..." />
          <SearchableSelect label="Placa (camión)" name="id_camion" required value={values.id_camion}
            onChange={onChangeCamion} options={camionOptions} error={errors.id_camion} placeholder="Buscar placa..." />
          <ReadOnly label="Transportista"
            value={transportistaSel ? transportistaSel.nombre_comercial : (camionSel ? '—' : 'Seleccione placa')}
            invalid={Boolean(values.id_camion) && !transportistaSel} />
          <SearchableSelect label="Piloto (licencia)" name="id_piloto" required value={values.id_piloto}
            onChange={(v) => setField('id_piloto', v)} options={pilotoOptions} error={errors.id_piloto}
            disabled={!camionSel}
            placeholder={!camionSel ? 'Seleccione placa primero' : (pilotoOptions.length ? 'Buscar licencia o nombre...' : 'Sin pilotos')} />
          <Input label="Fecha" name="fecha" type="date" required value={values.fecha}
            onChange={(e) => setField('fecha', e.target.value)} error={errors.fecha} />
          <Input label="Cantidad (galones)" name="cantidad" type="number" min={0} step="0.01" required value={values.cantidad}
            onChange={(e) => setField('cantidad', e.target.value)} error={errors.cantidad} />
          <ReadOnly label="Precio / galón" value={facturaSel ? formatCurrency(precio) : '—'} />
          <ReadOnly label="Total" value={formatCurrency(total)} strong />
        </div>
        {facturaSel && (
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
            Saldo disponible de la factura: <b>{formatNumber(saldo)}</b> · Estado del vale al guardar: <b>ACTIVO</b>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(confirmRow)}
        onClose={() => setConfirmRow(null)}
        onConfirm={anular}
        title="Anular vale"
        confirmText="Anular"
        message="¿Anular este vale? Su estado pasará a ANULADO y se restaurará el saldo de la factura."
      />
    </div>
  );
}

const accionBtn = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '2px 6px' };
function ReadOnly({ label, value, invalid, strong }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <input className={`form-control ${invalid ? 'is-invalid' : ''}`} value={value ?? '-'} readOnly disabled
        style={{ background: '#f3f4f6', cursor: 'not-allowed', fontWeight: strong ? 700 : undefined, color: strong ? '#c1121f' : undefined }} />
    </div>
  );
}
