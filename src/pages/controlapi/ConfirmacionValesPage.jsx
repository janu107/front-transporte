/**
 * ConfirmacionValesPage.jsx — CONTROL DEL API / Confirmación de Vales (Enlace MATO).
 *
 * Flujo:
 *  1. Tabla de vales del API en estado 'P' (Pendiente); auto-refresco cada 3 min.
 *     - Buscador global sobre TODOS los campos visibles (incluye el PREDIO).
 *     - Columna PREDIO: se asigna por fila (se persiste al instante).  [CAMBIO 1]
 *  2. Al hacer clic en una fila se abre el modal "Genera Vale SETRASA" en cascada:
 *     Póliza (ABIERTA) → Placa (del vale) → Transportista (auto, solo lectura) →
 *     Piloto (del transportista) → Factura (ACTIVO + saldo).  [CAMBIO 2]
 *     Ya NO se captura Ubicación (predio) ni Surtidor/Bomba en el modal.
 *  3. CONFIRMAR: ejecuta sp_confirmar_despacho_api (id_bomba/id_producto salen de
 *     la factura elegida) y marca el vale como 'C' (Confirmado).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import SearchableSelect from '../../components/common/SearchableSelect';
import Modal from '../../components/common/Modal';
import SearchBar from '../../components/common/SearchBar';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import realApi from '../../api/realApi';
import controlApiService from '../../services/controlApi.service';
import { formatNumber, formatDate, formatCurrency } from '../../utils/formatters';
import { imprimirValeCombustible } from '../../utils/impresionDocs';

const REFRESH_MS = 3 * 60 * 1000; // 3 minutos
const FORM_VACIO = { idPoliza: '', idPiloto: '', idFactura: '' };

// Normaliza una placa para comparar (mayúsculas, sin espacios ni guiones).
const normPlaca = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export default function ConfirmacionValesPage() {
  // Datos del API y catálogos
  const [pendientes, setPendientes] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [transportistas, setTransportistas] = useState([]);
  const [pilotos, setPilotos] = useState([]);
  const [camiones, setCamiones] = useState([]);
  const [polizas, setPolizas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Selección y formulario del modal
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);

  // [M3.1] Predio activo: selector global arriba de la tabla (contexto/preselección).
  const [predioActivo, setPredioActivo] = useState('');
  // [M4.2] Placa escrita a mano cuando el vale es "LLAVE MAESTRA".
  const [placaManual, setPlacaManual] = useState('');

  const [message, setMessage] = useState(null); // { type, text }
  const [confirming, setConfirming] = useState(false);
  // [v8 §4] Último vale confirmado (para imprimir) y modal de reimpresión.
  const [ultimoConfirmado, setUltimoConfirmado] = useState(null); // { apiId, numero }
  const [reimprOpen, setReimprOpen] = useState(false);
  const [reimprF, setReimprF] = useState({ vale: '', placa: '' });
  const [reimprRes, setReimprRes] = useState(null);
  const [reimprLoading, setReimprLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const PAGE_SIZE = 10;

  const notify = useCallback((type, text) => {
    setMessage({ type, text });
    if (type !== 'error') setTimeout(() => setMessage(null), 6000);
  }, []);

  // ---- Carga de vales pendientes (estado 'P') ----
  // [P3a] El predio NO filtra la lista (los vales del API casi nunca traen predio):
  // se muestran todos y el predio elegido se usa como etiqueta en la columna.
  const cargarPendientes = useCallback(async () => {
    try {
      const data = await controlApiService.listarPendientes();
      setPendientes(data);
      setLastUpdate(new Date());
      // Conserva la selección solo si el vale sigue pendiente.
      setSelected((prev) => (prev && data.some((r) => r.api_id === prev.api_id) ? prev : null));
    } catch (e) {
      notify('error', e?.userMessage || e?.response?.data?.message || 'No se pudieron cargar los vales del API.');
    }
  }, [notify]);

  // ---- Catálogos (una sola vez) ----
  useEffect(() => {
    (async () => {
      const [ub, fa, tr, pi, ca, po] = await Promise.all([
        realApi.list('ubicacionBomba').catch(() => []),
        realApi.list('facturasVales').catch(() => []),
        realApi.list('transportistas').catch(() => []),
        realApi.list('pilotos').catch(() => []),
        realApi.list('camiones').catch(() => []),
        realApi.list('polizas').catch(() => []),
      ]);
      setUbicaciones(ub); setFacturas(fa);
      setTransportistas(tr); setPilotos(pi); setCamiones(ca); setPolizas(po);
    })();
  }, []);

  // ---- Pendientes: carga inicial ----
  useEffect(() => {
    setLoading(true);
    cargarPendientes().finally(() => setLoading(false));
  }, [cargarPendientes]);

  // ---- Refresco automático cada 3 minutos ----
  useEffect(() => {
    const id = setInterval(cargarPendientes, REFRESH_MS);
    return () => clearInterval(id);
  }, [cargarPendientes]);

  // ---- Opciones derivadas del modal ----
  // Póliza: sólo ABIERTA (activas).
  const polizaOptions = useMemo(
    () => polizas
      .filter((p) => String(p.estado).toUpperCase() === 'ABIERTA')
      .map((p) => ({ value: p.codigo, label: p.nombre_poliza })),
    [polizas]
  );

  // [M4.2] Si el vale viene de "LLAVE MAESTRA", la placa es editable a mano.
  const esLlaveMaestra = /^\s*LLAVE\s*MAESTRA/i.test(selected?.api_nombre_piloto || '');
  const placaEfectiva = esLlaveMaestra ? placaManual : (selected?.api_placa || '');

  // Camión que corresponde a la placa efectiva (del vale o la escrita a mano).
  const camionSel = useMemo(() => {
    const placa = normPlaca(placaEfectiva);
    if (!placa) return null;
    return camiones.find((c) => normPlaca(c.placa) === placa) || null;
  }, [placaEfectiva, camiones]);

  // Transportista del camión (solo lectura).
  const transportistaSel = useMemo(
    () => (camionSel ? transportistas.find((t) => String(t.codigo) === String(camionSel.id_transportista)) || null : null),
    [camionSel, transportistas]
  );

  // Pilotos del transportista (por licencia).
  const pilotoOptions = useMemo(() => {
    if (!camionSel) return [];
    return pilotos
      .filter((p) => String(p.id_transportista) === String(camionSel.id_transportista))
      .map((p) => ({
        value: p.codigo,
        label: `${p.licencia || 's/l'} — ${p.nombres} ${p.apellidos || ''}`.trim(),
      }));
  }, [camionSel, pilotos]);

  // Facturas ACTIVO con saldo disponible.
  const facturaOptions = useMemo(
    () => facturas
      .filter((f) => String(f.estado).toUpperCase() === 'ACTIVO' && Number(f.saldo) > 0)
      .map((f) => ({
        value: f.codigo,
        label: `${f.factura || 's/f'} — saldo ${formatNumber(f.saldo)} gal · ${formatCurrency(f.precio)}`,
      })),
    [facturas]
  );

  const facturaSel = facturas.find((f) => String(f.codigo) === String(form.idFactura)) || null;

  // Cálculos para mostrar (galones del MATO, precio de la factura, total)
  const galones = selected ? Number(selected.api_cant_galones) : 0;
  const precio = facturaSel ? Number(facturaSel.precio) : 0;
  const total = galones * precio;

  const placaValida = Boolean(camionSel && transportistaSel);

  // ---- Handlers ----
  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  // [P3a] Nombre del predio elegido en el selector global (etiqueta de contexto).
  const predioActivoNombre = ubicaciones.find((u) => String(u.codigo) === String(predioActivo))?.descripcion || null;
  // Predio que se muestra en cada fila: si hay predio elegido, se usa como etiqueta
  // para todas las filas; si no, se muestra el predio propio del vale.
  const predioDeFila = useCallback(
    (row) => (predioActivo ? predioActivoNombre : (row.api_ubicacion_nombre || null)),
    [predioActivo, predioActivoNombre]
  );

  // Abre el modal con el vale elegido, partiendo de un formulario limpio.
  const seleccionarVale = (row) => {
    setSelected(row);
    setForm(FORM_VACIO);
    setPlacaManual(row.api_placa || '');
    setMessage(null);
  };

  // Cierra el modal y descarta la selección/formulario.
  const cerrarModal = () => {
    setSelected(null);
    setForm(FORM_VACIO);
    setPlacaManual('');
    setMessage(null);
  };

  const puedeConfirmar =
    selected &&
    placaValida &&
    form.idPoliza &&
    form.idPiloto &&
    form.idFactura &&
    !confirming;

  const confirmar = async () => {
    if (!puedeConfirmar) return;
    setConfirming(true);
    setMessage(null);
    try {
      const payload = {
        api_id: selected.api_id,
        id_piloto: Number(form.idPiloto),
        id_camion: Number(camionSel.codigo),
        id_transportista: Number(camionSel.id_transportista),
        id_producto: Number(facturaSel.id_producto), // producto de la factura seleccionada
        id_bomba: Number(facturaSel.id_bomba), // bomba de la factura seleccionada
        id_poliza: Number(form.idPoliza),
      };
      const apiId = selected.api_id;
      const numero = selected.api_numero;
      const r = await controlApiService.confirmar(payload);
      // [M1] Respuesta del servicio externo (confirma + PDF + correo).
      const correoTxt = r.correo_enviado
        ? ` Correo enviado a ${r.correo || 'transportista'}.`
        : (r.correo_error ? ` (Correo NO enviado: ${r.correo_error})` : '');
      notify('success', `${r.mensaje || 'Despacho confirmado.'}${correoTxt}`);
      // [v8 §4] Guarda el despacho confirmado para imprimir el vale generado.
      setUltimoConfirmado({ apiId, numero });
      // Limpia y recarga (cierra el modal)
      setForm(FORM_VACIO);
      setSelected(null);
      await cargarPendientes();
      // Refresca facturas para reflejar el saldo descontado.
      realApi.list('facturasVales').then(setFacturas).catch(() => {});
    } catch (e) {
      notify('error', e?.userMessage || e?.response?.data?.message || 'No se pudo confirmar el servicio de despacho.');
    } finally {
      setConfirming(false);
    }
  };

  // [v8 §4] Imprime el/los vale(s) de combustible generado(s) al confirmar un despacho.
  const imprimirValeGenerado = async (apiId) => {
    try {
      const vales = await realApi.detalleFacturaPorApi(apiId);
      vales.forEach((v) => imprimirValeCombustible(v));
    } catch (e) {
      notify('error', e?.userMessage || e?.response?.data?.message || 'No se pudo obtener el vale generado.');
    }
  };

  // [v8 §4] Reimpresión: busca vales de combustible por número de vale y/o placa.
  const buscarReimpresion = async () => {
    if (!reimprF.vale.trim() && !reimprF.placa.trim()) { notify('error', 'Indique el número de vale o la placa.'); return; }
    setReimprLoading(true);
    try {
      setReimprRes(await realApi.detalleFacturaReimpresion({ vale: reimprF.vale, placa: reimprF.placa }));
    } catch (e) {
      setReimprRes([]);
      notify('error', e?.userMessage || e?.response?.data?.message || 'No se pudo realizar la búsqueda.');
    } finally { setReimprLoading(false); }
  };

  // Búsqueda libre sobre TODOS los campos visibles de la tabla (con el mismo
  // formato que ve el usuario: número, fecha dd/mm/aaaa, predio, estado, etc.).
  const busquedaNorm = busqueda.trim().toLowerCase();
  const pendientesFiltrados = useMemo(() => {
    if (!busquedaNorm) return pendientes;
    return pendientes.filter((row) => {
      const campos = [
        row.api_numero,
        formatNumber(row.api_cant_galones),
        formatDate(row.api_fecha),
        row.api_nombre_piloto,
        row.api_placa,           // PLACA
        row.api_surtidor,
        predioDeFila(row),       // PREDIO
        'Pendiente',
      ];
      return campos.some((c) => c != null && String(c).toLowerCase().includes(busquedaNorm));
    });
  }, [pendientes, busquedaNorm, predioDeFila]);

  // Reinicia a la página 1 cuando cambia el filtro o la lista.
  useEffect(() => { setPagina(1); }, [busquedaNorm, pendientes.length]);

  const totalPaginas = Math.max(1, Math.ceil(pendientesFiltrados.length / PAGE_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const valesPagina = pendientesFiltrados.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE);

  const COLS = 8;

  return (
    <div>
      <PageHeader
        title="Confirmación de Vales"
        description="Control del API · Enlace MATO. Vales pendientes de despacho reportados desde el API."
      />

      {/* Alerta a nivel de página (solo cuando el modal está cerrado). */}
      {message && !selected && (
        <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>
      )}

      {/* [v8 §4] Vale recién confirmado: permite imprimirlo de una vez. */}
      {ultimoConfirmado && !selected && (
        <div className="alert alert-success" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span>Vale del MATO <b>{ultimoConfirmado.numero}</b> confirmado. Puede imprimir el vale generado.</span>
          <span style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" icon="🖨️" onClick={() => imprimirValeGenerado(ultimoConfirmado.apiId)}>Imprimir vale</Button>
            <Button variant="secondary" onClick={() => setUltimoConfirmado(null)}>Cerrar</Button>
          </span>
        </div>
      )}

      {/* [M3.1] Selector global de predio (arriba de la tabla). */}
      <div className="toolbar" style={{ alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
        <div style={{ minWidth: 260 }}>
          <Select
            label="Ubicación (predio)"
            name="predioActivo"
            value={predioActivo}
            onChange={(e) => setPredioActivo(e.target.value)}
            options={ubicaciones.map((u) => ({ value: u.codigo, label: u.descripcion }))}
            placeholder="Todos los predios"
          />
        </div>
      </div>

      {/* Barra superior: buscador + actualizar / último refresco */}
      <div className="toolbar" style={{ alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 320px', minWidth: 260, maxWidth: 440 }}>
          <SearchBar
            value={busqueda}
            onChange={(v) => { setBusqueda(v); setPagina(1); }}
            placeholder="Buscar (mato, galones, piloto, placa, predio...)"
          />
        </div>
        <div className="spacer" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastUpdate && (
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              Actualizado {lastUpdate.toLocaleTimeString('es-GT')} · auto cada 3 min
            </span>
          )}
          <Button variant="secondary" icon="🖨️" onClick={() => { setReimprF({ vale: '', placa: '' }); setReimprRes(null); setReimprOpen(true); }}>
            Reimpresión
          </Button>
          <Button variant="secondary" icon="🔄" onClick={cargarPendientes}>
            Actualizar
          </Button>
        </div>
      </div>

      {/* Tabla de vales pendientes (estado 'P') */}
      <div className="table-wrapper table-wrapper--cards">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>No. Mato</th>
                <th>Galones</th>
                <th>Fecha</th>
                <th>Nombre Piloto</th>
                <th>Placa</th>
                <th>Surtidor</th>
                <th>Predio</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={COLS} style={{ textAlign: 'center', padding: 40 }}>Cargando...</td>
                </tr>
              ) : pendientes.length === 0 ? (
                <tr>
                  <td colSpan={COLS} style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                    No hay vales pendientes en el API.
                  </td>
                </tr>
              ) : pendientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={COLS} style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                    No se encontraron vales que coincidan con «{busqueda.trim()}».
                  </td>
                </tr>
              ) : (
                valesPagina.map((row) => {
                  const isSel = selected && selected.api_id === row.api_id;
                  return (
                    <tr
                      key={row.api_id}
                      onClick={() => seleccionarVale(row)}
                      style={{
                        cursor: 'pointer',
                        background: isSel ? 'rgba(193,18,31,0.10)' : undefined,
                      }}
                    >
                      <td data-label="No. Mato" style={{ fontWeight: 600 }}>{row.api_numero}</td>
                      <td data-label="Galones">{formatNumber(row.api_cant_galones)}</td>
                      <td data-label="Fecha">{formatDate(row.api_fecha)}</td>
                      <td data-label="Nombre Piloto">{row.api_nombre_piloto || '-'}</td>
                      <td data-label="Placa">{row.api_placa || '-'}</td>
                      <td data-label="Surtidor">{row.api_surtidor ?? '-'}</td>
                      {/* [M3.1] Predio: preseleccionado por el selector global (o el propio del vale). */}
                      <td data-label="Predio">{predioDeFila(row) || '—'}</td>
                      <td data-label="Estado"><span className="badge badge-pendiente">Pendiente</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && pendientes.length > 0 && (
          <div className="table-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>
              {busquedaNorm
                ? `${pendientesFiltrados.length} de ${pendientes.length} vale(s)`
                : `${pendientes.length} vale(s) pendiente(s)`}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                style={paginaBtnStyle}
              >
                ‹ Anterior
              </button>
              <span style={{ fontSize: 13, color: '#374151', minWidth: 80, textAlign: 'center' }}>
                Página {paginaActual} de {totalPaginas}
              </span>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
                style={paginaBtnStyle}
              >
                Siguiente ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmación: se abre al seleccionar un vale de la tabla. */}
      <Modal
        isOpen={!!selected}
        onClose={cerrarModal}
        size="lg"
        title={selected ? `Confirmar vale — MATO ${selected.api_numero}` : 'Confirmar vale'}
        footer={
          <>
            <Button variant="secondary" onClick={cerrarModal}>Cancelar</Button>
            <Button variant="primary" icon="✅" onClick={confirmar} disabled={!puedeConfirmar}>
              {confirming ? 'Confirmando...' : 'CONFIRMAR'}
            </Button>
          </>
        }
      >
        {selected && (
          <>
            {/* Alerta de errores de confirmación dentro del modal. */}
            {message && (
              <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`} style={{ marginTop: 0 }}>
                {message.text}
              </div>
            )}

            {/* Datos MATO (solo lectura, compacto) */}
            <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Datos MATO</h4>
            <dl style={dlStyle}>
              <Dato label="No. Mato" value={selected.api_numero} />
              <Dato label="No. Vale" value={selected.api_num_vale} />
              <Dato label="Galones" value={formatNumber(selected.api_cant_galones)} />
              <Dato label="Fecha" value={formatDate(selected.api_fecha)} />
              <Dato label="Nombre Piloto" value={selected.api_nombre_piloto} />
              <Dato label="Placa" value={selected.api_placa} />
              <Dato label="Manguera" value={selected.api_manguera} />
              <Dato label="Surtidor" value={selected.api_surtidor} />
              <Dato label="Predio" value={selected.api_ubicacion_nombre} />
              <Dato label="Estado" value="Pendiente" />
            </dl>

            {/* Genera Vale SETRASA — cascada */}
            <h4 style={{ margin: '14px 0 10px', paddingTop: 12, borderTop: '1px solid #eceef1', fontSize: 14 }}>
              Genera Vale SETRASA
            </h4>
            <div className="form-grid">
              {/* [2026-08 §4] Póliza editable con búsqueda tipo "like". */}
              <SearchableSelect
                label="Póliza (activa)" name="idPoliza" required className="col-span-2"
                value={form.idPoliza}
                onChange={(v) => setField('idPoliza', v)}
                options={polizaOptions}
                placeholder={polizaOptions.length ? 'Escriba para buscar póliza ABIERTA...' : 'No hay pólizas abiertas'}
              />

              {/* Placa: del vale (solo lectura) o editable si es LLAVE MAESTRA [M4.2] */}
              {esLlaveMaestra ? (
                <div className="form-field">
                  <label className="form-label">
                    Camión (placa) <span className="req">*</span>
                    <span style={{ color: '#c1121f', fontSize: 11, marginLeft: 6 }}>LLAVE MAESTRA · editable</span>
                  </label>
                  <input
                    className={`form-control ${placaEfectiva && !camionSel ? 'is-invalid' : ''}`}
                    value={placaManual}
                    onChange={(e) => setPlacaManual(e.target.value)}
                    placeholder="Escriba la placa..."
                  />
                </div>
              ) : (
                <ReadOnlyField label="Camión (placa)" value={selected.api_placa || '—'} />
              )}
              <ReadOnlyField
                label="Transportista"
                value={placaValida ? transportistaSel.nombre_comercial : (camionSel ? '—' : 'Placa no registrada')}
                invalid={!placaValida}
              />

              <Select
                label="Piloto (licencia)" name="idPiloto" required
                value={form.idPiloto}
                onChange={(e) => setField('idPiloto', e.target.value)}
                options={pilotoOptions}
                disabled={!placaValida}
                placeholder={
                  !placaValida ? 'Valide la placa primero' : (pilotoOptions.length ? 'Seleccione licencia...' : 'El transportista no tiene pilotos')
                }
              />
              <Select
                label="Factura / Vale (activa con saldo)" name="idFactura" required
                value={form.idFactura}
                onChange={(e) => setField('idFactura', e.target.value)}
                options={facturaOptions}
                placeholder={facturaOptions.length ? 'Seleccione factura...' : 'Sin facturas activas con saldo'}
              />
            </div>

            {!placaValida && (
              <div className="alert alert-error" style={{ marginTop: 12 }}>
                La placa del vale (<b>{selected.api_placa || 's/placa'}</b>) no está registrada en Camiones.
                Regístrela en Mantenimientos → Camiones para poder confirmar este vale.
              </div>
            )}

            {/* Resumen galones / precio / total */}
            <div style={resumenStyle}>
              <Resumen label="Galones" value={formatNumber(galones)} />
              <Resumen label="Precio" value={formatCurrency(precio)} />
              <Resumen label="Total" value={formatCurrency(total)} strong />
            </div>
          </>
        )}
      </Modal>

      {/* [v8 §4] Reimpresión de vales de combustible por número de vale o placa */}
      <Modal
        isOpen={reimprOpen}
        onClose={() => setReimprOpen(false)}
        size="lg"
        title="Reimpresión de vale de combustible"
        footer={<Button variant="secondary" onClick={() => setReimprOpen(false)}>Cerrar</Button>}
      >
        <div className="form-grid" style={{ alignItems: 'flex-end' }}>
          <Input label="N° de vale" name="vale" value={reimprF.vale}
            onChange={(e) => setReimprF((p) => ({ ...p, vale: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') buscarReimpresion(); }} placeholder="Ej. 8915" />
          <Input label="Placa" name="placa" value={reimprF.placa}
            onChange={(e) => setReimprF((p) => ({ ...p, placa: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') buscarReimpresion(); }} placeholder="Ej. 114BXQ" />
          <Button variant="primary" icon="🔍" onClick={buscarReimpresion} disabled={reimprLoading}>
            {reimprLoading ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 12px' }}>Busca por número de vale y/o placa.</p>

        {reimprRes !== null && (
          <div className="table-wrapper">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>N° Vale</th><th>Fecha</th><th>Placa</th><th>Transportista</th>
                    <th>Póliza</th><th style={{ textAlign: 'right' }}>Total</th><th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Imprimir</th>
                  </tr>
                </thead>
                <tbody>
                  {reimprRes.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: '#6b7280' }}>Sin resultados.</td></tr>
                  ) : reimprRes.map((r) => (
                    <tr key={r.correlativo}>
                      <td>{r.numero}</td>
                      <td>{formatDate(r.fecha)}</td>
                      <td>{r.placa}</td>
                      <td>{r.transportista}</td>
                      <td>{r.poliza}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(r.total)}</td>
                      <td><Badge value={r.estado} /></td>
                      <td style={{ textAlign: 'right' }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}
                          title="Reimprimir vale" onClick={() => imprimirValeCombustible(r)}>🖨️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ---- Subcomponentes de presentación ---- */
const dlStyle = { display: 'grid', gridTemplateColumns: '84px 1fr 84px 1fr', rowGap: 3, columnGap: 12, margin: 0, fontSize: 12.5 };
const paginaBtnStyle = {
  padding: '4px 12px', fontSize: 13, borderRadius: 6, border: '1px solid #d1d5db',
  background: '#fff', cursor: 'pointer', color: '#374151',
};
const resumenStyle = {
  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16,
  padding: '12px 14px', background: '#f8f9fb', borderRadius: 8, border: '1px solid #eceef1',
};

function Dato({ label, value }) {
  return (
    <>
      <dt style={{ color: '#6b7280', fontSize: 11.5 }}>{label}</dt>
      <dd style={{ margin: 0, fontWeight: 600, fontSize: 12.5 }}>{value ?? '-'}</dd>
    </>
  );
}

// Campo de solo lectura con la misma apariencia que los inputs del formulario.
function ReadOnlyField({ label, value, invalid }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <input
        className={`form-control ${invalid ? 'is-invalid' : ''}`}
        value={value ?? '-'}
        readOnly
        disabled
        style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
      />
    </div>
  );
}

function Resumen({ label, value, strong }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
      <div style={{ fontSize: strong ? 18 : 15, fontWeight: strong ? 700 : 600, color: strong ? '#c1121f' : '#1a1a1a' }}>
        {value}
      </div>
    </div>
  );
}
