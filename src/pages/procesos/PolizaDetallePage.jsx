/**
 * PolizaDetallePage.jsx — REGISTRO DE VIAJES (Detalle de Póliza / Envíos).
 * Reproduce la ventana legacy "REGISTRO – VIAJES":
 *   - Tipo (Viajes Locales / Carta de Porte / Exportación)
 *   - Póliza ABIERTA  -> muestra pesos, saldo de piezas y viajes realizados
 *   - Tarifa de embarque
 *   - Placa (camión) -> Transportista automático (solo lectura) -> Piloto (licencia)
 *   - No. de TC, Fecha, No. de Piezas, Peso (kg)
 *   - VALOR calculado = Peso × 0.0043 (solo lectura; el backend lo recalcula)
 *   - Observaciones
 *   - Totales: Saldo de Piezas y Viajes Realizados
 *
 * Reglas validadas también en el servidor (/viajes): póliza abierta, piloto del
 * transportista y piezas ≤ saldo disponible de la póliza.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import SearchBar from '../../components/common/SearchBar';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import realApi from '../../api/realApi';
import { lookup, formatDate, formatNumber, formatCurrency } from '../../utils/formatters';
import { TIPO_VIAJE_OPTIONS } from '../../utils/constants';
import { imprimirCartaPorte } from '../../utils/impresionDocs';

const EMPTY = {
  num_envio: '', tipo: 'Viajes Locales', id_poliza: '', id_tarifa_embarque: '',
  id_camion: '', num_tc: '', id_piloto: '', fecha: '',
  cantidad_bultos_piezas: '', peso: '', observaciones: '', estado: 'PENDIENTE',
};

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export default function PolizaDetallePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Catálogos
  const [polizas, setPolizas] = useState([]);
  const [camiones, setCamiones] = useState([]);
  const [transportistas, setTransportistas] = useState([]);
  const [pilotos, setPilotos] = useState([]);
  const [tarifas, setTarifas] = useState([]);

  // Modal / formulario
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // fila en edición o null
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Resumen de la póliza seleccionada (saldo, viajes, pesos)
  const [resumen, setResumen] = useState(null);
  const [resumenLoading, setResumenLoading] = useState(false);

  // [M2] Resultado del backend al validar/calcular (saldo restante + valor).
  const [calc, setCalc] = useState(null);       // { saldo_piezas, valor, mensaje }
  const [calcMsg, setCalcMsg] = useState(null);  // { type, text }

  const [confirmRow, setConfirmRow] = useState(null); // fila a anular
  const [term, setTerm] = useState('');

  const notify = useCallback((type, text) => {
    setMessage({ type, text });
    if (type !== 'error') setTimeout(() => setMessage(null), 6000);
  }, []);

  const cargarViajes = useCallback(async () => {
    try {
      setItems(await realApi.list('viajes'));
    } catch (e) {
      notify('error', e?.userMessage || 'No se pudieron cargar los viajes.');
    }
  }, [notify]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [po, ca, tr, pi, ta] = await Promise.all([
        realApi.list('polizas').catch(() => []),
        realApi.list('camiones').catch(() => []),
        realApi.list('transportistas').catch(() => []),
        realApi.list('pilotos').catch(() => []),
        realApi.list('tarifaEmbarque').catch(() => []),
      ]);
      setPolizas(po); setCamiones(ca); setTransportistas(tr); setPilotos(pi); setTarifas(ta);
      await cargarViajes();
      setLoading(false);
    })();
  }, [cargarViajes]);

  // ---- Opciones ----
  const polizaOptions = useMemo(
    () => polizas
      .filter((p) => String(p.estado).toUpperCase() === 'ABIERTA')
      .map((p) => ({ value: p.codigo, label: p.nombre_poliza })),
    [polizas]
  );
  const tarifaOptions = useMemo(
    () => tarifas
      .filter((t) => String(t.estado).toUpperCase() === 'ACTIVO')
      .map((t) => ({ value: t.codigo, label: t.descripcion })),
    [tarifas]
  );
  const camionOptions = useMemo(() => camiones.map((c) => ({ value: c.codigo, label: c.placa })), [camiones]);

  const camionSel = useMemo(
    () => camiones.find((c) => String(c.codigo) === String(values.id_camion)) || null,
    [camiones, values.id_camion]
  );
  const transportistaSel = useMemo(
    () => (camionSel ? transportistas.find((t) => String(t.codigo) === String(camionSel.id_transportista)) || null : null),
    [camionSel, transportistas]
  );
  const pilotoOptions = useMemo(() => {
    if (!camionSel) return [];
    return pilotos
      .filter((p) => String(p.id_transportista) === String(camionSel.id_transportista))
      .map((p) => ({ value: p.codigo, label: `${p.licencia || 's/l'} — ${p.nombres} ${p.apellidos || ''}`.trim() }));
  }, [camionSel, pilotos]);

  // ---- Calculados ----
  // El valor lo calcula el backend (peso × 0.022046 × tarifa) vía validarEnvio.
  const valorMostrar = calc ? calc.valor : (editing ? num(editing.valor) : 0);

  // Piezas máximas para ESTE viaje: el saldo ya descuenta todos los viajes;
  // al editar, se le suma lo que este viaje ya tenía reservado.
  const piezasMax = useMemo(() => {
    if (!resumen) return Infinity;
    const propias = editing ? num(editing.cantidad_bultos_piezas) : 0;
    return num(resumen.saldo_piezas) + propias;
  }, [resumen, editing]);

  const piezasLive = num(values.cantidad_bultos_piezas);
  const saldoDisponible = resumen ? piezasMax : null;
  const saldoTrasViaje = resumen ? piezasMax - piezasLive : null;

  // ---- Resumen de la póliza ----
  const cargarResumen = useCallback(async (idPoliza) => {
    if (!idPoliza) { setResumen(null); return; }
    setResumenLoading(true);
    try {
      setResumen(await realApi.viajeResumen(idPoliza));
    } catch {
      setResumen(null);
    } finally {
      setResumenLoading(false);
    }
  }, []);

  // ---- Handlers de formulario ----
  const setField = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const onChangePoliza = (value) => {
    setField('id_poliza', value);
    setCalc(null); setCalcMsg(null);
    cargarResumen(value);
  };

  // [M2] Valida piezas vs saldo y calcula el valor en el backend (se llama onBlur).
  const validarEnvio = useCallback(async () => {
    if (!values.id_poliza || !values.id_tarifa_embarque
        || values.cantidad_bultos_piezas === '' || values.peso === '') return;
    try {
      const r = await realApi.viajeValidar({
        id_poliza: values.id_poliza,
        id_tarifa_embarque: values.id_tarifa_embarque,
        cantidad_piezas: values.cantidad_bultos_piezas,
        peso_kg: values.peso,
      });
      setCalc(r);
      setCalcMsg({ type: 'ok', text: r.mensaje });
      setErrors((p) => ({ ...p, cantidad_bultos_piezas: undefined }));
    } catch (e) {
      setCalc(null);
      setCalcMsg({ type: 'error', text: e?.userMessage || e?.response?.data?.mensaje || e?.response?.data?.message || 'No se pudo validar el envío.' });
    }
  }, [values.id_poliza, values.id_tarifa_embarque, values.cantidad_bultos_piezas, values.peso]);

  // Datos para la Carta de Porte a partir de una fila de viaje.
  const datosCarta = (r) => {
    const p = pilotos.find((x) => String(x.codigo) === String(r.id_piloto));
    return {
      numero: r.num_envio,
      fecha: r.fecha,
      predioOrigen: lookup(transportistas, r.id_transportista, 'codigo', 'nombre_comercial'),
      destino: lookup(polizas, r.id_poliza, 'codigo', 'nombre_poliza'),
      piloto: p ? `${p.nombres} ${p.apellidos || ''}`.trim() : '',
      placa: lookup(camiones, r.id_camion, 'codigo', 'placa'),
      cantidad: r.cantidad_bultos_piezas,
      tc: r.num_tc,
      contiene: r.observaciones,
      poliza: lookup(polizas, r.id_poliza, 'codigo', 'nombre_poliza'),
    };
  };

  // Al cambiar el camión (placa) se reinicia el piloto (cambia el transportista).
  const onChangeCamion = (value) => {
    setValues((prev) => ({ ...prev, id_camion: value, id_piloto: '' }));
    setErrors((prev) => ({ ...prev, id_camion: undefined, id_piloto: undefined }));
  };

  const abrirNuevo = () => {
    setEditing(null);
    setValues(EMPTY);
    setErrors({});
    setResumen(null);
    setCalc(null); setCalcMsg(null);
    setMessage(null);
    setModalOpen(true);
  };

  const abrirEditar = (row) => {
    setEditing(row);
    setValues({
      ...EMPTY,
      ...row,
      // normaliza null -> '' para inputs controlados
      num_envio: row.num_envio ?? '', tipo: row.tipo ?? 'Viajes Locales',
      id_poliza: row.id_poliza ?? '', id_tarifa_embarque: row.id_tarifa_embarque ?? '',
      id_camion: row.id_camion ?? '', num_tc: row.num_tc ?? '', id_piloto: row.id_piloto ?? '',
      fecha: row.fecha ? String(row.fecha).slice(0, 10) : '',
      cantidad_bultos_piezas: row.cantidad_bultos_piezas ?? '', peso: row.peso ?? '',
      observaciones: row.observaciones ?? '', estado: row.estado ?? 'PENDIENTE',
    });
    setErrors({});
    setCalc(null); setCalcMsg(null);
    setMessage(null);
    setModalOpen(true);
    cargarResumen(row.id_poliza);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setEditing(null);
    setValues(EMPTY);
    setErrors({});
    setResumen(null);
    setCalc(null); setCalcMsg(null);
  };

  const validar = () => {
    const e = {};
    if (!values.id_poliza) e.id_poliza = 'Seleccione una póliza';
    if (!values.id_camion) e.id_camion = 'Seleccione la placa';
    else if (!transportistaSel) e.id_camion = 'La placa no tiene transportista válido';
    if (!values.id_piloto) e.id_piloto = 'Seleccione el piloto';
    if (!values.fecha) e.fecha = 'La fecha es obligatoria';
    if (piezasLive < 0) e.cantidad_bultos_piezas = 'No puede ser negativo';
    else if (resumen && piezasLive > piezasMax) {
      e.cantidad_bultos_piezas = `Excede el saldo disponible (${formatNumber(piezasMax, 0)})`;
    }
    if (num(values.peso) < 0) e.peso = 'No puede ser negativo';
    return e;
  };

  const guardar = async () => {
    const e = validar();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        ...values,
        id_transportista: camionSel ? camionSel.id_transportista : null,
        valor: valorMostrar,
      };
      let saved;
      if (editing) {
        saved = await realApi.update('viajes', editing.correlativo, payload);
      } else {
        saved = await realApi.create('viajes', payload);
      }
      // [M5.3] Muestra el correlativo asignado por el servidor.
      notify('success', editing
        ? 'Viaje actualizado correctamente.'
        : `Viaje registrado. No. de envío asignado: ${saved?.num_envio || '(ver listado)'}`);
      cerrarModal();
      await cargarViajes();
    } catch (err) {
      // Error de negocio del servidor (saldo, póliza no abierta, etc.)
      notify('error', err?.userMessage || err?.response?.data?.message || 'No se pudo guardar el viaje.');
    } finally {
      setSaving(false);
    }
  };

  const anular = async () => {
    const row = confirmRow;
    setConfirmRow(null);
    try {
      await realApi.patchEstado('viajes', row.correlativo, 'ANULADA');
      notify('success', 'Viaje anulado.');
      await cargarViajes();
    } catch (err) {
      notify('error', err?.userMessage || 'No se pudo anular el viaje.');
    }
  };

  // ---- Búsqueda ----
  const filtrados = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) => {
      const campos = [
        r.num_envio, r.tipo, r.num_tc, r.observaciones,
        lookup(polizas, r.id_poliza, 'codigo', 'nombre_poliza'),
        lookup(transportistas, r.id_transportista, 'codigo', 'nombre_comercial'),
        lookup(camiones, r.id_camion, 'codigo', 'placa'),
      ];
      return campos.some((c) => c != null && String(c).toLowerCase().includes(q));
    });
  }, [items, term, polizas, transportistas, camiones]);

  return (
    <div>
      <PageHeader
        title="Registro de Viajes"
        description="Detalle de póliza / envíos. Registra viajes por póliza y controla el saldo de piezas."
        actionLabel="+ Nuevo viaje"
        onAction={abrirNuevo}
      />

      {message && <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>}

      <div className="toolbar">
        <SearchBar value={term} onChange={setTerm} placeholder="Buscar por envío, tipo, TC, póliza, transportista o placa..." />
      </div>

      <div className="table-wrapper">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Corr.</th>
                <th>N° Envío</th>
                <th>Tipo</th>
                <th>Póliza</th>
                <th>Transportista</th>
                <th>Placa</th>
                <th>Fecha</th>
                <th>Piezas</th>
                <th>Peso</th>
                <th>Valor</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={12} style={{ textAlign: 'center', padding: 40 }}>Cargando...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={12} style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Sin viajes registrados.</td></tr>
              ) : (
                filtrados.map((r) => (
                  <tr key={r.correlativo}>
                    <td>{r.correlativo}</td>
                    <td>{r.num_envio || '-'}</td>
                    <td>{r.tipo || '-'}</td>
                    <td>{lookup(polizas, r.id_poliza, 'codigo', 'nombre_poliza')}</td>
                    <td>{lookup(transportistas, r.id_transportista, 'codigo', 'nombre_comercial')}</td>
                    <td>{lookup(camiones, r.id_camion, 'codigo', 'placa')}</td>
                    <td>{formatDate(r.fecha)}</td>
                    <td>{formatNumber(r.cantidad_bultos_piezas, 0)}</td>
                    <td>{formatNumber(r.peso)}</td>
                    <td>{formatCurrency(r.valor)}</td>
                    <td><Badge value={r.estado} /></td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button style={accionBtn} title="Imprimir Carta de Porte" onClick={() => imprimirCartaPorte(datosCarta(r))}>🖨️</button>
                      <button style={accionBtn} title="Editar" onClick={() => abrirEditar(r)}>✏️</button>
                      {String(r.estado).toUpperCase() !== 'ANULADA' && (
                        <button style={accionBtn} title="Anular" onClick={() => setConfirmRow(r)}>🚫</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo/Editar viaje (estilo legacy) */}
      <Modal
        isOpen={modalOpen}
        onClose={cerrarModal}
        size="lg"
        title={editing ? `Editar viaje #${editing.correlativo}` : 'Nuevo viaje'}
        footer={
          <>
            <Button variant="secondary" onClick={cerrarModal} disabled={saving}>Cancelar</Button>
            <Button variant="primary" icon="💾" onClick={guardar} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        {/* Datos de la póliza */}
        <h4 style={secTitle}>Datos de la póliza</h4>
        <div className="form-grid">
          {/* [M5.2] Tipo de viaje como chips: se ve como multiselect pero es selección única. */}
          <div className="form-field col-span-2">
            <label className="form-label">Tipo de viaje <span className="req">*</span></label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TIPO_VIAJE_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setField('tipo', opt.value)}
                  style={chipStyle(values.tipo === opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <Select label="Póliza (ABIERTA)" name="id_poliza" required value={values.id_poliza}
            onChange={(e) => onChangePoliza(e.target.value)} options={polizaOptions} error={errors.id_poliza}
            placeholder={polizaOptions.length ? 'Seleccione póliza...' : 'No hay pólizas abiertas'} />
          <Select label="Tarifa de embarque" name="id_tarifa_embarque" value={values.id_tarifa_embarque}
            onChange={(e) => { setField('id_tarifa_embarque', e.target.value); setCalc(null); setCalcMsg(null); }}
            options={tarifaOptions} placeholder="Seleccione tarifa..." />
          <ReadOnly label="Pesos de la póliza"
            value={resumen ? `${formatNumber(resumen.peso_total)} · ${formatNumber(resumen.cantidad_piezas, 0)} pzs` : (resumenLoading ? 'Cargando...' : '—')} />
        </div>

        {/* Transportista */}
        <h4 style={secTitle}>Transportista</h4>
        <div className="form-grid">
          <Select label="Placa (camión)" name="id_camion" required value={values.id_camion}
            onChange={(e) => onChangeCamion(e.target.value)} options={camionOptions} error={errors.id_camion}
            placeholder="Seleccione placa..." />
          <Input label="No. de TC" name="num_tc" value={values.num_tc}
            onChange={(e) => setField('num_tc', e.target.value)} placeholder="Tarjeta de circulación" />
          <ReadOnly label="Transportista"
            value={transportistaSel ? transportistaSel.nombre_comercial : (camionSel ? '—' : 'Seleccione placa')}
            invalid={Boolean(values.id_camion) && !transportistaSel} />
          <Select label="Piloto (licencia)" name="id_piloto" required value={values.id_piloto}
            onChange={(e) => setField('id_piloto', e.target.value)} options={pilotoOptions} error={errors.id_piloto}
            disabled={!camionSel}
            placeholder={!camionSel ? 'Seleccione placa primero' : (pilotoOptions.length ? 'Seleccione licencia...' : 'Sin pilotos del transportista')} />
        </div>

        {/* Datos del envío */}
        <h4 style={secTitle}>Datos del envío</h4>
        <div className="form-grid">
          {/* [M5.3] Número de envío: solo lectura, se asigna al guardar (correlativo AÑO+00000). */}
          <ReadOnly label="Número de envío"
            value={values.num_envio || '(se asigna al guardar)'} />
          <Input label="Fecha de envío" name="fecha" type="date" required value={values.fecha}
            onChange={(e) => setField('fecha', e.target.value)} error={errors.fecha} />
          <Input label="No. de piezas" name="cantidad_bultos_piezas" type="number" min={0} value={values.cantidad_bultos_piezas}
            onChange={(e) => setField('cantidad_bultos_piezas', e.target.value)} onBlur={validarEnvio} error={errors.cantidad_bultos_piezas} />
          <Input label="Peso (kilogramos)" name="peso" type="number" min={0} step="0.01" value={values.peso}
            onChange={(e) => setField('peso', e.target.value)} onBlur={validarEnvio} error={errors.peso} />
          <ReadOnly label="Valor (Peso × 0.022046 × tarifa)" value={formatCurrency(valorMostrar)} strong />
          <Input className="col-span-2" label="Observaciones" name="observaciones" value={values.observaciones}
            onChange={(e) => setField('observaciones', e.target.value)} />
        </div>

        {/* [M2] Mensaje del cálculo/validación del servidor. */}
        {calcMsg && (
          <div className={`alert alert-${calcMsg.type === 'error' ? 'error' : 'success'}`} style={{ marginTop: 10 }}>
            {calcMsg.text}
          </div>
        )}

        {/* Totales (como en el legacy) */}
        <div style={totalesBox}>
          <Total label="Saldo de piezas" value={saldoDisponible == null ? '—' : formatNumber(saldoTrasViaje, 0)}
            hint={saldoDisponible == null ? 'Seleccione póliza' : `disponible: ${formatNumber(saldoDisponible, 0)}`} />
          <Total label="Viajes realizados" value={resumen ? formatNumber(resumen.viajes_realizados, 0) : '—'} />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(confirmRow)}
        onClose={() => setConfirmRow(null)}
        onConfirm={anular}
        title="Anular viaje"
        confirmText="Anular"
        message="¿Está seguro de anular este viaje? Su estado cambiará a ANULADA y liberará las piezas en la póliza."
      />
    </div>
  );
}

/* ---- estilos / subcomponentes ---- */
// [M5.1] Espaciado compacto para que el formulario quepa sin scroll.
const secTitle = { margin: '10px 0 6px', fontSize: 13, fontWeight: 700, color: '#374151' };
const accionBtn = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '2px 6px' };
const totalesBox = {
  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 12,
  padding: '10px 14px', background: '#f8f9fb', borderRadius: 8, border: '1px solid #eceef1',
};

// [M5.2] Estilo de chip para el selector de tipo (activo = rojo SETRASA).
function chipStyle(active) {
  return {
    padding: '6px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
    border: `1px solid ${active ? '#c1121f' : '#d1d5db'}`,
    background: active ? '#c1121f' : '#fff',
    color: active ? '#fff' : '#374151',
    fontWeight: active ? 700 : 500,
    transition: 'all .15s',
  };
}

function ReadOnly({ label, value, invalid, strong }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <input
        className={`form-control ${invalid ? 'is-invalid' : ''}`}
        value={value ?? '-'} readOnly disabled
        style={{ background: '#f3f4f6', cursor: 'not-allowed', fontWeight: strong ? 700 : undefined, color: strong ? '#c1121f' : undefined }}
      />
    </div>
  );
}

function Total({ label, value, hint }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{value}</div>
      {hint && <div style={{ fontSize: 11, color: '#9ca3af' }}>{hint}</div>}
    </div>
  );
}
