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
import SearchableSelect from '../../components/common/SearchableSelect';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import SearchBar from '../../components/common/SearchBar';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import TablePager from '../../components/common/TablePager';
import usePagination from '../../hooks/usePagination';
import useAuth from '../../hooks/useAuth';
import realApi from '../../api/realApi';
import { esAdmin } from '../../utils/roles';
import { lookup, formatDate, formatNumber, formatCurrency } from '../../utils/formatters';
import { TIPO_VIAJE_OPTIONS } from '../../utils/constants';
import { imprimirCartaPorte } from '../../utils/impresionDocs';

const EMPTY = {
  num_envio: '', tipo: 'Viajes Locales', id_poliza: '', id_tarifa_embarque: '',
  id_camion: '', num_tc: '', id_piloto: '', fecha: '',
  cantidad_bultos_piezas: '', peso: '', observaciones: '', estado: 'ACTIVO',
};

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export default function PolizaDetallePage() {
  const { user } = useAuth();
  // Solo ADMIN puede editar o anular viajes; los demás roles registran e imprimen.
  const admin = esAdmin(user);
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
  const [saved, setSaved] = useState(null); // [4.4] viaje recién guardado (se queda en el modal para imprimir)

  // Resumen de la póliza seleccionada (saldo, viajes, pesos)
  const [resumen, setResumen] = useState(null);
  const [resumenLoading, setResumenLoading] = useState(false);

  // [M2] Resultado del backend al validar/calcular (saldo restante + valor).
  const [calc, setCalc] = useState(null);       // { saldo_piezas, valor, mensaje }
  const [calcMsg, setCalcMsg] = useState(null);  // { type, text }

  const [confirmRow, setConfirmRow] = useState(null); // fila a anular
  const [term, setTerm] = useState('');

  // [v8 §6] Edición rápida del PESO (recalcula el valor automáticamente).
  const [pesoEdit, setPesoEdit] = useState(null); // { row, peso }
  const [pesoSaving, setPesoSaving] = useState(false);

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
      // Si un catálogo falla se avisa en pantalla: antes se quedaba vacío en
      // silencio y el buscador solo decía "Sin resultados", sin explicar por qué.
      const fallidos = [];
      const traer = (recurso, nombre) => realApi.list(recurso).catch(() => {
        fallidos.push(nombre);
        return [];
      });
      const [po, ca, tr, pi, ta] = await Promise.all([
        traer('polizas', 'pólizas'),
        traer('camiones', 'camiones'),
        traer('transportistas', 'transportistas'),
        traer('pilotos', 'pilotos'),
        traer('tarifaEmbarque', 'tarifas de embarque'),
      ]);
      setPolizas(po); setCamiones(ca); setTransportistas(tr); setPilotos(pi); setTarifas(ta);
      if (fallidos.length) {
        notify('error', `No se pudo cargar el catálogo de ${fallidos.join(', ')}. `
          + 'Vuelva a entrar a la pantalla; si sigue igual, avise al administrador.');
      }
      await cargarViajes();
      setLoading(false);
    })();
    // `notify` es estable (useCallback sin dependencias); no reejecuta el efecto.
  }, [cargarViajes, notify]);

  // ---- Opciones ----
  const polizaOptions = useMemo(
    () => polizas
      .filter((p) => String(p.estado).toUpperCase() === 'ABIERTA')
      .map((p) => ({ value: p.codigo, label: p.nombre_poliza })),
    [polizas]
  );
  // Ordenadas por CÓDIGO ascendente, y con `buscar` limitado a código, origen,
  // destino y descripción: así al teclear un número se busca la tarifa y no los
  // dígitos del valor en quetzales, que antes ensuciaban el resultado.
  const tarifaOptions = useMemo(
    () => tarifas
      .filter((t) => String(t.estado).toUpperCase() === 'ACTIVO')
      .slice()
      .sort((a, b) => Number(a.codigo) - Number(b.codigo))
      .map((t) => ({
        value: t.codigo,
        label: `${t.codigo} · ${t.origen || '—'} → ${t.destino || '—'} · Q${t.valor}`,
        buscar: [t.codigo, t.origen, t.destino, t.descripcion].filter(Boolean).join(' '),
      })),
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

  // [2026-08 §5] Viaje local: el número de envío se escribe a mano. En Carta de
  // Porte / Exportación se asigna el correlativo automático al guardar.
  const esLocal = String(values.tipo || '').toLowerCase().includes('local');

  // [v8 §6] Valor recalculado EN VIVO al editar el peso (misma fórmula del backend:
  // peso × 0.022046 × valor de la tarifa de embarque del viaje).
  const pesoEditValor = useMemo(() => {
    if (!pesoEdit) return 0;
    const tar = tarifas.find((x) => String(x.codigo) === String(pesoEdit.row.id_tarifa_embarque));
    const vt = tar ? Number(tar.valor || 0) : 0;
    return Number((Number(pesoEdit.peso || 0) * 0.022046 * vt).toFixed(2));
  }, [pesoEdit, tarifas]);

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

  // La suma de los envíos nunca puede pasar de las piezas de la póliza: si ya no
  // queda saldo se avisa y se bloquea Guardar, en vez de dejar intentar y que el
  // servidor lo rechace después de haber llenado todo el formulario.
  const limiteAlcanzado = Boolean(resumen) && piezasMax <= 0;
  const excedeSaldo = Boolean(resumen) && piezasLive > piezasMax;

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
    const tar = tarifas.find((x) => String(x.codigo) === String(r.id_tarifa_embarque));
    return {
      numero: r.num_envio,
      fecha: r.fecha,
      // [P11] origen/destino del embarque salen de la tarifa seleccionada.
      origen: tar ? tar.origen : '',
      destino: tar ? tar.destino : '',
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

  // Reinicia el formulario a "nuevo" (sin cerrar el modal). Se usa en abrir y en el botón Nuevo.
  const resetFormulario = () => {
    setEditing(null);
    setValues(EMPTY);
    setErrors({});
    setResumen(null);
    setCalc(null); setCalcMsg(null);
    setSaved(null);
  };

  const abrirNuevo = () => {
    resetFormulario();
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
      observaciones: row.observaciones ?? '', estado: row.estado ?? 'ACTIVO',
    });
    setErrors({});
    setCalc(null); setCalcMsg(null);
    setSaved(null);
    setMessage(null);
    setModalOpen(true);
    cargarResumen(row.id_poliza);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    resetFormulario();
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
      let res;
      if (editing) {
        res = await realApi.update('viajes', editing.correlativo, payload);
      } else {
        res = await realApi.create('viajes', payload);
      }
      // [4.4] NO se cierra el modal: se conserva el resultado para imprimir / presionar Nuevo.
      setSaved(res);
      await cargarViajes();
      // El saldo y el desglose del pie tienen que reflejar el envío recién
      // grabado: el modal queda abierto y desde ahí se registra el siguiente.
      await cargarResumen(values.id_poliza);
    } catch (err) {
      // Error de negocio del servidor (saldo, póliza no abierta, etc.)
      notify('error', err?.userMessage || err?.response?.data?.message || 'No se pudo guardar el viaje.');
    } finally {
      setSaving(false);
    }
  };

  // [v8 §6] Guarda solo el nuevo peso; el backend recalcula el valor (peso × tarifa).
  const guardarPeso = async () => {
    if (!pesoEdit) return;
    if (Number(pesoEdit.peso) < 0) { notify('error', 'El peso no puede ser negativo.'); return; }
    setPesoSaving(true);
    try {
      const row = pesoEdit.row;
      const payload = {
        num_envio: row.num_envio, tipo: row.tipo, id_poliza: row.id_poliza,
        id_tarifa_embarque: row.id_tarifa_embarque, id_camion: row.id_camion,
        num_tc: row.num_tc, id_piloto: row.id_piloto,
        fecha: row.fecha ? String(row.fecha).slice(0, 10) : row.fecha,
        cantidad_bultos_piezas: row.cantidad_bultos_piezas,
        peso: pesoEdit.peso, observaciones: row.observaciones, estado: row.estado,
      };
      await realApi.update('viajes', row.correlativo, payload);
      notify('success', 'Peso actualizado; el valor se recalculó automáticamente.');
      setPesoEdit(null);
      await cargarViajes();
      if (String(resumen?.id_poliza) === String(row.id_poliza)) await cargarResumen(row.id_poliza);
    } catch (err) {
      notify('error', err?.userMessage || err?.response?.data?.message || 'No se pudo actualizar el peso.');
    } finally {
      setPesoSaving(false);
    }
  };

  // [v8 §7] "Nuevo viaje": conserva Tipo, Póliza y Tarifa; limpia de Transportista
  // hacia abajo (placa, TC, piloto, envío, fecha, piezas, peso, observaciones).
  const nuevoViaje = () => {
    setEditing(null);
    setValues((prev) => ({
      ...EMPTY, tipo: prev.tipo, id_poliza: prev.id_poliza, id_tarifa_embarque: prev.id_tarifa_embarque,
    }));
    setErrors({});
    setCalc(null); setCalcMsg(null);
    setSaved(null);
    // Se conserva el resumen (misma póliza).
  };

  const anular = async () => {
    const row = confirmRow;
    setConfirmRow(null);
    try {
      await realApi.patchEstado('viajes', row.correlativo, 'ANULADO');
      notify('success', 'Viaje anulado.');
      await cargarViajes();
      // Anular libera las piezas del envío: el saldo vuelve a subir.
      if (String(resumen?.id_poliza) === String(row.id_poliza)) await cargarResumen(row.id_poliza);
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

  // [2026-08 §3] Paginación de 25 en 25 (del más nuevo al más antiguo).
  const pag = usePagination(filtrados, 25);

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

      <div className="table-wrapper table-wrapper--cards">
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
                pag.visibles.map((r) => (
                  <tr key={r.correlativo}>
                    <td data-label="Corr.">{r.correlativo}</td>
                    <td data-label="N° Envío">{r.num_envio || '-'}</td>
                    <td data-label="Tipo">{r.tipo || '-'}</td>
                    <td data-label="Póliza">{lookup(polizas, r.id_poliza, 'codigo', 'nombre_poliza')}</td>
                    <td data-label="Transportista">{lookup(transportistas, r.id_transportista, 'codigo', 'nombre_comercial')}</td>
                    <td data-label="Placa">{lookup(camiones, r.id_camion, 'codigo', 'placa')}</td>
                    <td data-label="Fecha">{formatDate(r.fecha)}</td>
                    <td data-label="Piezas">{formatNumber(r.cantidad_bultos_piezas, 0)}</td>
                    <td data-label="Peso">{formatNumber(r.peso)}</td>
                    <td data-label="Valor">{formatCurrency(r.valor)}</td>
                    <td data-label="Estado"><Badge value={r.estado} /></td>
                    <td className="col-actions" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button style={accionBtn} title="Imprimir Carta de Porte" aria-label="Imprimir Carta de Porte" onClick={() => imprimirCartaPorte(datosCarta(r))}>🖨️</button>
                      {/* Editar peso, editar y anular: exclusivo de ADMIN. */}
                      {admin && (
                        <>
                          <button style={accionBtn} title="Editar peso (recalcula el valor)" aria-label="Editar peso" onClick={() => setPesoEdit({ row: r, peso: r.peso ?? '' })}>⚖️</button>
                          <button style={accionBtn} title="Editar viaje" aria-label="Editar viaje" onClick={() => abrirEditar(r)}>✏️</button>
                          {String(r.estado).toUpperCase() !== 'ANULADO' && (
                            <button style={accionBtn} title="Anular" aria-label="Anular" onClick={() => setConfirmRow(r)}>🚫</button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePager {...pag} />
      </div>

      {/* Modal Nuevo/Editar viaje (estilo legacy) */}
      <Modal
        isOpen={modalOpen}
        onClose={cerrarModal}
        size="lg"
        title={editing ? `Editar viaje #${editing.correlativo}` : 'Nuevo viaje'}
        footer={saved ? (
          <>
            <Button variant="secondary" onClick={cerrarModal}>Cerrar</Button>
            <Button variant="secondary" icon="🖨️" onClick={() => imprimirCartaPorte(datosCarta(saved))}>Imprimir</Button>
            {/* [v8 §7] Nuevo viaje conserva póliza/tarifa; Nueva póliza limpia todo. */}
            <Button variant="secondary" icon="➕" onClick={nuevoViaje}>Nuevo viaje</Button>
            <Button variant="primary" icon="🔄" onClick={resetFormulario}>Nueva póliza</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={cerrarModal} disabled={saving}>Cancelar</Button>
            <Button variant="primary" icon="💾" onClick={guardar}
              disabled={saving || limiteAlcanzado || excedeSaldo}
              title={limiteAlcanzado ? 'La póliza ya no tiene saldo de piezas'
                : (excedeSaldo ? 'Las piezas superan el saldo disponible' : undefined)}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        )}
      >
        {/* [4.4] Confirmación con el correlativo asignado (el modal no se cierra al guardar). */}
        {saved && (
          <div className="alert alert-success" style={{ marginTop: 0 }}>
            ✅ Viaje guardado correctamente. Número de envío: <b>{saved.num_envio}</b>. Puede imprimir la carta o presionar «Nuevo».
          </div>
        )}

        {/* Datos de la póliza */}
        <h4 style={secTitle}>Datos de la póliza</h4>
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
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
          {/* [2026-08 §5] Póliza editable con búsqueda tipo "like". */}
          <SearchableSelect label="Póliza (ABIERTA)" name="id_poliza" required value={values.id_poliza}
            onChange={(v) => onChangePoliza(v)} options={polizaOptions} error={errors.id_poliza}
            placeholder={polizaOptions.length ? 'Escriba para buscar póliza...' : 'No hay pólizas abiertas'} />
          <SearchableSelect label="Tarifa de embarque" name="id_tarifa_embarque" value={values.id_tarifa_embarque}
            onChange={(v) => { setField('id_tarifa_embarque', v); setCalc(null); setCalcMsg(null); }}
            options={tarifaOptions} placeholder="Buscar tarifa (código, origen, destino)..." />
          <ReadOnly label="Pesos de la póliza"
            value={resumen ? `${formatNumber(resumen.peso_total)} · ${formatNumber(resumen.cantidad_piezas, 0)} pzs` : (resumenLoading ? 'Cargando...' : '—')} />
        </div>

        {/* Transportista */}
        <h4 style={secTitle}>Transportista</h4>
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <SearchableSelect label="Placa (camión)" name="id_camion" required value={values.id_camion}
            onChange={(v) => onChangeCamion(v)} options={camionOptions} error={errors.id_camion}
            placeholder="Buscar placa..." />
          <Input label="No. de TC" name="num_tc" value={values.num_tc}
            onChange={(e) => setField('num_tc', e.target.value)} placeholder="Tarjeta de circulación" />
          <ReadOnly label="Transportista"
            value={transportistaSel ? transportistaSel.nombre_comercial : (camionSel ? '—' : 'Seleccione placa')}
            invalid={Boolean(values.id_camion) && !transportistaSel} />
          <SearchableSelect label="Piloto (licencia)" name="id_piloto" required value={values.id_piloto}
            onChange={(v) => setField('id_piloto', v)} options={pilotoOptions} error={errors.id_piloto}
            disabled={!camionSel}
            placeholder={!camionSel ? 'Seleccione placa primero' : (pilotoOptions.length ? 'Buscar licencia o nombre...' : 'Sin pilotos del transportista')} />
        </div>

        {/* Datos del envío */}
        <h4 style={secTitle}>Datos del envío</h4>
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          {/* [2026-08 §5] Número de envío: editable en Viajes Locales; en Carta de Porte
              y Exportación se asigna el correlativo automático (AÑO+00000) al guardar. */}
          {esLocal ? (
            <Input label="Número de envío" name="num_envio" value={values.num_envio}
              onChange={(e) => setField('num_envio', e.target.value)}
              placeholder="Escriba el número de envío" error={errors.num_envio} />
          ) : (
            <ReadOnly label="Número de envío"
              value={values.num_envio || '(se asigna al guardar)'} />
          )}
          <Input label="Fecha de envío" name="fecha" type="date" required value={values.fecha}
            onChange={(e) => setField('fecha', e.target.value)} error={errors.fecha} />
          <Input label="No. de piezas" name="cantidad_bultos_piezas" type="number" min={0} value={values.cantidad_bultos_piezas}
            onChange={(e) => setField('cantidad_bultos_piezas', e.target.value)} onBlur={validarEnvio} error={errors.cantidad_bultos_piezas} />
          <Input label="Peso (kilogramos)" name="peso" type="number" min={0} step="0.01" value={values.peso}
            onChange={(e) => setField('peso', e.target.value)} onBlur={validarEnvio} error={errors.peso} />
          <ReadOnly label="Valor" value={formatCurrency(valorMostrar)} strong />
          <Input className="col-span-2" label="Observaciones" name="observaciones" value={values.observaciones}
            onChange={(e) => setField('observaciones', e.target.value)} />
        </div>

        {/* [M2] Mensaje del cálculo/validación del servidor. */}
        {calcMsg && (
          <div className={`alert alert-${calcMsg.type === 'error' ? 'error' : 'success'}`} style={{ marginTop: 10 }}>
            {calcMsg.text}
          </div>
        )}

        {/* Aviso de límite: la póliza ya no admite más piezas. */}
        {limiteAlcanzado && (
          <div className="alert alert-error" style={{ marginTop: 10 }}>
            El saldo de esta póliza llegó a su límite: ya se despacharon las{' '}
            {formatNumber(resumen.cantidad_piezas, 0)} piezas. No se pueden registrar más envíos.
          </div>
        )}
        {!limiteAlcanzado && excedeSaldo && (
          <div className="alert alert-error" style={{ marginTop: 10 }}>
            Las piezas de este envío ({formatNumber(piezasLive, 0)}) superan el saldo
            disponible ({formatNumber(piezasMax, 0)}).
          </div>
        )}

        {/* Totales (como en el legacy) + desglose por punto de embarque. Todo se
            obtiene sumando los envíos ACTIVOS; la póliza nunca se modifica. */}
        <div style={totalesBox}>
          <Total label="Saldo de piezas" value={saldoDisponible == null ? '—' : formatNumber(saldoTrasViaje, 0)}
            hint={saldoDisponible == null ? 'Seleccione póliza' : `disponible: ${formatNumber(saldoDisponible, 0)}`} />
          <Total label="Viajes realizados" value={resumen ? formatNumber(resumen.viajes_realizados, 0) : '—'} />

          {resumen && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                Consumo por punto de embarque
              </div>
              <table style={tablaPuntos}>
                <thead>
                  <tr>
                    <th style={thPunto}>Punto de embarque</th>
                    <th style={thNum}>Viajes</th>
                    <th style={thNum}>Piezas</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.puntos?.length ? resumen.puntos.map((pt) => (
                    <tr key={pt.id_tarifa_embarque ?? 'sin-punto'}>
                      <td style={tdPunto}>{pt.descripcion}</td>
                      <td style={tdNum}>{formatNumber(pt.viajes, 0)}</td>
                      <td style={tdNum}>{formatNumber(pt.piezas, 0)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td style={{ ...tdPunto, color: '#9ca3af' }} colSpan={3}>
                        Esta póliza aún no tiene envíos registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td style={{ ...tdPunto, fontWeight: 700 }}>Total de la póliza</td>
                    <td style={{ ...tdNum, fontWeight: 700 }}>{formatNumber(resumen.viajes_realizados, 0)}</td>
                    <td style={{ ...tdNum, fontWeight: 700 }}>
                      {formatNumber(resumen.piezas_usadas, 0)} de {formatNumber(resumen.cantidad_piezas, 0)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ ...tdPunto, fontWeight: 700 }}>Saldo de piezas</td>
                    <td style={tdNum} />
                    <td style={{ ...tdNum, fontWeight: 700, color: limiteAlcanzado ? '#c1121f' : '#1a1a1a' }}>
                      {formatNumber(resumen.saldo_piezas, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* [v8 §6] Modal de edición rápida del PESO (recalcula el valor en vivo) */}
      <Modal
        isOpen={Boolean(pesoEdit)}
        onClose={() => setPesoEdit(null)}
        size="md"
        title={`Editar peso — envío ${pesoEdit?.row?.num_envio || ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPesoEdit(null)} disabled={pesoSaving}>Cancelar</Button>
            <Button variant="primary" icon="💾" onClick={guardarPeso} disabled={pesoSaving}>
              {pesoSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        {pesoEdit && (
          <div className="form-grid">
            <Input label="Peso (kilogramos)" name="pesoEdit" type="number" min={0} step="0.01"
              value={pesoEdit.peso}
              onChange={(e) => setPesoEdit((p) => ({ ...p, peso: e.target.value }))} />
            <ReadOnly label="Valor (recalculado)" value={formatCurrency(pesoEditValor)} strong />
            <div className="col-span-2" style={{ fontSize: 12, color: '#9ca3af' }}>
              El valor se recalcula automáticamente (peso × tarifa de embarque) y el
              servidor lo vuelve a validar al guardar.
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(confirmRow)}
        onClose={() => setConfirmRow(null)}
        onConfirm={anular}
        title="Anular viaje"
        confirmText="Anular"
        message="¿Está seguro de anular este viaje? Su estado cambiará a ANULADO y liberará las piezas en la póliza."
      />
    </div>
  );
}

/* ---- estilos / subcomponentes ---- */
// [M5.1] Espaciado compacto para que el formulario quepa sin scroll.
const secTitle = { margin: '10px 0 6px', fontSize: 13, fontWeight: 700, color: '#374151' };
const accionBtn = {
  background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
  minWidth: 40, minHeight: 40, padding: 8, borderRadius: '50%',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};
const tablaPuntos = {
  width: '100%', borderCollapse: 'collapse', fontSize: 12.5, background: '#fff',
  border: '1px solid #eceef1', borderRadius: 6,
};
const thPunto = {
  textAlign: 'left', padding: '5px 8px', color: '#6b7280', fontWeight: 600,
  borderBottom: '1px solid #eceef1',
};
const thNum = { ...thPunto, textAlign: 'right', whiteSpace: 'nowrap' };
const tdPunto = { padding: '5px 8px', borderTop: '1px solid #f3f4f6' };
const tdNum = { ...tdPunto, textAlign: 'right', whiteSpace: 'nowrap' };

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
