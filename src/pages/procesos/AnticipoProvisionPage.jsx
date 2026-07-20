/**
 * AnticipoProvisionPage.jsx — ANTICIPOS / PROVISIÓN (pro_anticipo_provision).
 * [M7] Cascada: Póliza (activa) → Placa → Transportista (auto, solo lectura) → Piloto.
 * Número de anticipo correlativo AÑO+00000 (lo asigna el servidor, solo lectura).
 * Estado sólo ACTIVO / ANULADO (al crear inicia ACTIVO). Impresión del vale.
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
import { toOptions } from '../../hooks/useRelated';
import { lookup, formatDate, formatCurrency } from '../../utils/formatters';
import { imprimirValeAnticipo } from '../../utils/impresionDocs';

const EMPTY = {
  num_anticipo: '', id_poliza: '', id_camion: '', id_piloto: '',
  id_tipo_anticipo_provision: '', fecha: '', valor: '', descripcion: '', estado: 'ACTIVO',
};
const ESTADO_OPTIONS = [{ value: 'ACTIVO', label: 'ACTIVO' }, { value: 'ANULADO', label: 'ANULADO' }];

export default function AnticipoProvisionPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const [polizas, setPolizas] = useState([]);
  const [camiones, setCamiones] = useState([]);
  const [transportistas, setTransportistas] = useState([]);
  const [pilotos, setPilotos] = useState([]);
  const [tipos, setTipos] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmRow, setConfirmRow] = useState(null);
  const [term, setTerm] = useState('');

  const notify = useCallback((type, text) => {
    setMessage({ type, text });
    if (type !== 'error') setTimeout(() => setMessage(null), 6000);
  }, []);

  const cargar = useCallback(async () => {
    try { setItems(await realApi.list('anticipos')); }
    catch (e) { notify('error', e?.userMessage || 'No se pudieron cargar los anticipos.'); }
  }, [notify]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [po, ca, tr, pi, ti] = await Promise.all([
        realApi.list('polizas').catch(() => []),
        realApi.list('camiones').catch(() => []),
        realApi.list('transportistas').catch(() => []),
        realApi.list('pilotos').catch(() => []),
        realApi.list('tipoAnticipoProvision').catch(() => []),
      ]);
      setPolizas(po); setCamiones(ca); setTransportistas(tr); setPilotos(pi); setTipos(ti);
      await cargar();
      setLoading(false);
    })();
  }, [cargar]);

  const polizaOptions = useMemo(
    () => polizas.filter((p) => String(p.estado).toUpperCase() === 'ABIERTA')
      .map((p) => ({ value: p.codigo, label: p.nombre_poliza })),
    [polizas]
  );
  const camionOptions = useMemo(() => camiones.map((c) => ({ value: c.codigo, label: c.placa })), [camiones]);
  const tipoOptions = toOptions(tipos);

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
    return pilotos.filter((p) => String(p.id_transportista) === String(camionSel.id_transportista))
      .map((p) => ({ value: p.codigo, label: `${p.licencia || 's/l'} — ${p.nombres} ${p.apellidos || ''}`.trim() }));
  }, [camionSel, pilotos]);

  const setField = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };
  const onChangeCamion = (value) => {
    setValues((prev) => ({ ...prev, id_camion: value, id_piloto: '' }));
    setErrors((prev) => ({ ...prev, id_camion: undefined, id_piloto: undefined }));
  };

  const abrirNuevo = () => {
    setEditing(null); setValues(EMPTY); setErrors({}); setMessage(null); setModalOpen(true);
  };
  const abrirEditar = (row) => {
    setEditing(row);
    setValues({
      ...EMPTY, ...row,
      num_anticipo: row.num_anticipo ?? '', id_poliza: row.id_poliza ?? '', id_camion: row.id_camion ?? '',
      id_piloto: row.id_piloto ?? '', id_tipo_anticipo_provision: row.id_tipo_anticipo_provision ?? '',
      fecha: row.fecha ? String(row.fecha).slice(0, 10) : '', valor: row.valor ?? '',
      descripcion: row.descripcion ?? '', estado: row.estado ?? 'ACTIVO',
    });
    setErrors({}); setMessage(null); setModalOpen(true);
  };
  const cerrarModal = () => {
    setModalOpen(false); setEditing(null); setValues(EMPTY); setErrors({});
  };

  const validar = () => {
    const e = {};
    if (!values.id_poliza) e.id_poliza = 'Seleccione una póliza';
    if (!values.id_camion) e.id_camion = 'Seleccione la placa';
    else if (!transportistaSel) e.id_camion = 'La placa no tiene transportista válido';
    if (!values.id_piloto) e.id_piloto = 'Seleccione el piloto';
    if (!values.id_tipo_anticipo_provision) e.id_tipo_anticipo_provision = 'Seleccione el tipo';
    if (!values.fecha) e.fecha = 'La fecha es obligatoria';
    if (values.valor === '' || Number(values.valor) < 0) e.valor = 'Valor inválido';
    return e;
  };

  const guardar = async () => {
    const e = validar();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true); setMessage(null);
    try {
      const payload = { ...values, id_transportista: camionSel ? camionSel.id_transportista : null };
      let saved;
      if (editing) saved = await realApi.update('anticipos', editing.correlativo, payload);
      else saved = await realApi.create('anticipos', payload);
      notify('success', editing
        ? 'Anticipo actualizado correctamente.'
        : `Anticipo registrado. No. asignado: ${saved?.num_anticipo || '(ver listado)'}`);
      cerrarModal();
      await cargar();
    } catch (err) {
      notify('error', err?.userMessage || err?.response?.data?.message || 'No se pudo guardar el anticipo.');
    } finally { setSaving(false); }
  };

  const anular = async () => {
    const row = confirmRow; setConfirmRow(null);
    try {
      await realApi.patchEstado('anticipos', row.correlativo, 'ANULADO');
      notify('success', 'Anticipo anulado.');
      await cargar();
    } catch (err) { notify('error', err?.userMessage || 'No se pudo anular.'); }
  };

  const datosVale = (r) => ({
    numero: r.num_anticipo,
    fecha: r.fecha,
    poliza: lookup(polizas, r.id_poliza, 'codigo', 'nombre_poliza'),
    placa: lookup(camiones, r.id_camion, 'codigo', 'placa'),
    transportista: lookup(transportistas, r.id_transportista, 'codigo', 'nombre_comercial'),
    concepto: r.descripcion || 'ABONO DE FLETES',
    total: r.valor,
  });

  const filtrados = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) => [
      r.num_anticipo, r.descripcion,
      lookup(polizas, r.id_poliza, 'codigo', 'nombre_poliza'),
      lookup(transportistas, r.id_transportista, 'codigo', 'nombre_comercial'),
      lookup(camiones, r.id_camion, 'codigo', 'placa'),
    ].some((c) => c != null && String(c).toLowerCase().includes(q)));
  }, [items, term, polizas, transportistas, camiones]);

  return (
    <div>
      <PageHeader
        title="Anticipos / Provisión"
        description="Registro de anticipos y provisiones por póliza."
        actionLabel="+ Nuevo anticipo"
        onAction={abrirNuevo}
      />
      {message && <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>}

      <div className="toolbar">
        <SearchBar value={term} onChange={setTerm} placeholder="Buscar por número, descripción, póliza, transportista o placa..." />
      </div>

      <div className="table-wrapper">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Corr.</th><th>N° Anticipo</th><th>Póliza</th><th>Transportista</th>
                <th>Tipo</th><th>Fecha</th><th>Valor</th><th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40 }}>Cargando...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Sin anticipos registrados.</td></tr>
              ) : (
                filtrados.map((r) => (
                  <tr key={r.correlativo}>
                    <td>{r.correlativo}</td>
                    <td>{r.num_anticipo || '-'}</td>
                    <td>{lookup(polizas, r.id_poliza, 'codigo', 'nombre_poliza')}</td>
                    <td>{lookup(transportistas, r.id_transportista, 'codigo', 'nombre_comercial')}</td>
                    <td>{lookup(tipos, r.id_tipo_anticipo_provision)}</td>
                    <td>{formatDate(r.fecha)}</td>
                    <td>{formatCurrency(r.valor)}</td>
                    <td><Badge value={r.estado} /></td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button style={accionBtn} title="Imprimir vale" onClick={() => imprimirValeAnticipo(datosVale(r))}>🖨️</button>
                      <button style={accionBtn} title="Editar" onClick={() => abrirEditar(r)}>✏️</button>
                      {String(r.estado).toUpperCase() !== 'ANULADO' && (
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

      <Modal
        isOpen={modalOpen}
        onClose={cerrarModal}
        size="lg"
        title={editing ? `Editar anticipo #${editing.correlativo}` : 'Nuevo anticipo / provisión'}
        footer={
          <>
            <Button variant="secondary" onClick={cerrarModal} disabled={saving}>Cancelar</Button>
            <Button variant="primary" icon="💾" onClick={guardar} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        <div className="form-grid">
          {/* Número de anticipo: solo lectura, correlativo AÑO+00000 al guardar. */}
          <ReadOnly label="Número de anticipo" value={values.num_anticipo || '(se asigna al guardar)'} />
          <Select label="Póliza (activa)" name="id_poliza" required value={values.id_poliza}
            onChange={(e) => setField('id_poliza', e.target.value)} options={polizaOptions} error={errors.id_poliza}
            placeholder={polizaOptions.length ? 'Seleccione póliza...' : 'No hay pólizas abiertas'} />

          <Select label="Placa (camión)" name="id_camion" required value={values.id_camion}
            onChange={(e) => onChangeCamion(e.target.value)} options={camionOptions} error={errors.id_camion}
            placeholder="Seleccione placa..." />
          <ReadOnly label="Transportista"
            value={transportistaSel ? transportistaSel.nombre_comercial : (camionSel ? '—' : 'Seleccione placa')}
            invalid={Boolean(values.id_camion) && !transportistaSel} />

          <Select label="Piloto (licencia)" name="id_piloto" required value={values.id_piloto}
            onChange={(e) => setField('id_piloto', e.target.value)} options={pilotoOptions} error={errors.id_piloto}
            disabled={!camionSel}
            placeholder={!camionSel ? 'Seleccione placa primero' : (pilotoOptions.length ? 'Seleccione licencia...' : 'Sin pilotos del transportista')} />
          <Select label="Tipo anticipo / provisión" name="id_tipo_anticipo_provision" required value={values.id_tipo_anticipo_provision}
            onChange={(e) => setField('id_tipo_anticipo_provision', e.target.value)} options={tipoOptions} error={errors.id_tipo_anticipo_provision}
            placeholder="Seleccione tipo..." />

          <Input label="Fecha" name="fecha" type="date" required value={values.fecha}
            onChange={(e) => setField('fecha', e.target.value)} error={errors.fecha} />
          <Input label="Valor" name="valor" type="number" min={0} step="0.01" required value={values.valor}
            onChange={(e) => setField('valor', e.target.value)} error={errors.valor} />

          {/* Estado sólo ACTIVO/ANULADO. Al crear inicia ACTIVO (no editable). */}
          {editing ? (
            <Select label="Estado" name="estado" value={values.estado}
              onChange={(e) => setField('estado', e.target.value)} options={ESTADO_OPTIONS} />
          ) : (
            <ReadOnly label="Estado" value="ACTIVO" />
          )}
          <Input className="col-span-2" label="Descripción" name="descripcion" value={values.descripcion}
            onChange={(e) => setField('descripcion', e.target.value)} />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(confirmRow)}
        onClose={() => setConfirmRow(null)}
        onConfirm={anular}
        title="Anular anticipo"
        confirmText="Anular"
        message="¿Está seguro de anular este anticipo? Su estado cambiará a ANULADO."
      />
    </div>
  );
}

const accionBtn = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '2px 6px' };

function ReadOnly({ label, value, invalid }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <input className={`form-control ${invalid ? 'is-invalid' : ''}`} value={value ?? '-'} readOnly disabled
        style={{ background: '#f3f4f6', cursor: 'not-allowed' }} />
    </div>
  );
}
