/**
 * ConfirmacionValesPage.jsx — CONTROL DEL API / Confirmación de Vales (Enlace MATO).
 *
 * Flujo:
 *  1. Muestra los vales capturados desde el API en estado 'P' (Pendiente).
 *     La vista se refresca automáticamente cada 3 minutos.
 *  2. Separación por surtidor/manguera por UBICACIÓN:
 *       ubicación -> bombas (cat_bombas.id_ubicacion) -> facturas (man_facturas_vales.id_bomba)
 *  3. Botón CONFIRMAR: ejecuta sp_confirmar_despacho_api, que genera el/los
 *     registro(s) en pro_detalle_facturas (1 normal, 2 si hay cruce de facturas)
 *     y marca el vale como 'C' (Confirmado).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import realApi from '../../api/realApi';
import controlApiService from '../../services/controlApi.service';
import { toOptions } from '../../hooks/useRelated';
import { formatNumber, formatDate, formatCurrency } from '../../utils/formatters';

const REFRESH_MS = 3 * 60 * 1000; // 3 minutos
const FORM_VACIO = { idTransportista: '', idPiloto: '', idCamion: '', idPoliza: '', idBomba: '', idFactura: '' };

export default function ConfirmacionValesPage() {
  // Datos del API y catálogos
  const [pendientes, setPendientes] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [bombas, setBombas] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [transportistas, setTransportistas] = useState([]);
  const [pilotos, setPilotos] = useState([]);
  const [camiones, setCamiones] = useState([]);
  const [polizas, setPolizas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Selección y formulario
  const [ubicacionFiltro, setUbicacionFiltro] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);

  const [message, setMessage] = useState(null); // { type, text }
  const [confirming, setConfirming] = useState(false);
  const [pagina, setPagina] = useState(1);
  const PAGE_SIZE = 10;

  const notify = useCallback((type, text) => {
    setMessage({ type, text });
    if (type !== 'error') setTimeout(() => setMessage(null), 6000);
  }, []);

  // ---- Carga de vales pendientes (estado 'P') ----
  const cargarPendientes = useCallback(async () => {
    try {
      const data = await controlApiService.listarPendientes();
      setPendientes(data);
      setLastUpdate(new Date());
      setPagina(1);
      // Conserva la selección solo si el vale sigue pendiente.
      setSelected((prev) => (prev && data.some((r) => r.api_id === prev.api_id) ? prev : null));
    } catch (e) {
      notify('error', e?.userMessage || e?.response?.data?.message || 'No se pudieron cargar los vales del API.');
    }
  }, [notify]);

  // ---- Carga inicial de catálogos + pendientes ----
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [ub, bo, fa, tr, pi, ca, po] = await Promise.all([
        realApi.list('ubicacionBomba').catch(() => []),
        realApi.list('bombas').catch(() => []),
        realApi.list('facturasVales').catch(() => []),
        realApi.list('transportistas').catch(() => []),
        realApi.list('pilotos').catch(() => []),
        realApi.list('camiones').catch(() => []),
        realApi.list('polizas').catch(() => []),
      ]);
      setUbicaciones(ub); setBombas(bo); setFacturas(fa);
      setTransportistas(tr); setPilotos(pi); setCamiones(ca); setPolizas(po);
      await cargarPendientes();
      setLoading(false);
    })();
  }, [cargarPendientes]);

  // ---- Refresco automático cada 3 minutos ----
  useEffect(() => {
    const id = setInterval(cargarPendientes, REFRESH_MS);
    return () => clearInterval(id);
  }, [cargarPendientes]);

  // ---- Opciones derivadas ----
  const ubicacionOptions = toOptions(ubicaciones, { value: 'codigo', label: 'descripcion' });
  const transportistaOptions = toOptions(transportistas, { value: 'codigo', label: 'nombre_comercial' });
  const pilotoOptions = toOptions(pilotos, { value: 'codigo', labelFn: (p) => `${p.nombres} ${p.apellidos || ''}`.trim() });
  const camionOptions = toOptions(camiones, { value: 'codigo', label: 'placa' });
  const polizaOptions = toOptions(polizas, { value: 'codigo', label: 'nombre_poliza' });

  // Ubicación (predio) elegida por el operador; determina las bombas disponibles.
  const ubicacionActiva = ubicacionFiltro ? Number(ubicacionFiltro) : null;

  const bombasUbicacion = useMemo(
    () => (ubicacionActiva ? bombas.filter((b) => Number(b.id_ubicacion) === Number(ubicacionActiva)) : bombas),
    [bombas, ubicacionActiva]
  );
  const bombaOptions = toOptions(bombasUbicacion, { value: 'codigo', label: 'descripcion' });

  // Facturas activas de la bomba elegida, con saldo disponible.
  const facturasBomba = useMemo(
    () =>
      facturas.filter(
        (f) => String(f.id_bomba) === String(form.idBomba) && Number(f.saldo) > 0
      ),
    [facturas, form.idBomba]
  );
  const facturaOptions = facturasBomba.map((f) => ({
    value: f.codigo,
    label: `${f.factura || 's/f'} — saldo ${formatNumber(f.saldo)} gal`,
  }));

  const facturaSel = facturas.find((f) => String(f.codigo) === String(form.idFactura)) || null;

  // Cálculos para mostrar (galones del MATO, precio de la factura, total)
  const galones = selected ? Number(selected.api_cant_galones) : 0;
  const precio = facturaSel ? Number(facturaSel.precio) : 0;
  const total = galones * precio;

  // ---- Handlers ----
  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));
  // Al cambiar la bomba se reinicia la factura (cambian las facturas disponibles).
  const setBomba = (value) => setForm((prev) => ({ ...prev, idBomba: value, idFactura: '' }));

  // Abre el modal con el vale elegido, partiendo de un formulario limpio.
  const seleccionarVale = (row) => {
    setSelected(row);
    setUbicacionFiltro('');
    setForm(FORM_VACIO);
    setMessage(null);
  };

  // Cierra el modal y descarta la selección/formulario.
  const cerrarModal = () => {
    setSelected(null);
    setUbicacionFiltro('');
    setForm(FORM_VACIO);
    setMessage(null);
  };

  const puedeConfirmar =
    selected &&
    form.idTransportista &&
    form.idPiloto &&
    form.idCamion &&
    form.idPoliza &&
    form.idBomba &&
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
        id_camion: Number(form.idCamion),
        id_transportista: Number(form.idTransportista),
        id_producto: Number(facturaSel.id_producto), // producto de la factura seleccionada
        id_bomba: Number(facturaSel.id_bomba), // bomba de la factura seleccionada
        id_poliza: Number(form.idPoliza),
      };
      const r = await controlApiService.confirmar(payload);
      const detalle = r.hubo_cruce
        ? `Se generaron 2 registros (cruce de facturas): #${r.det1} y #${r.det2}.`
        : `Se generó el registro #${r.det1}.`;
      notify('success', `${r.mensaje} ${detalle}`);
      // Limpia y recarga (cierra el modal)
      setForm(FORM_VACIO);
      setSelected(null);
      setUbicacionFiltro('');
      await cargarPendientes();
      // Refresca facturas para reflejar el saldo descontado.
      realApi.list('facturasVales').then(setFacturas).catch(() => {});
    } catch (e) {
      notify('error', e?.userMessage || e?.response?.data?.message || 'No se pudo confirmar el despacho.');
    } finally {
      setConfirming(false);
    }
  };

  const totalPaginas = Math.max(1, Math.ceil(pendientes.length / PAGE_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const valesPagina = pendientes.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE);

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

      {/* Barra superior: actualizar / último refresco */}
      <div className="toolbar" style={{ alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div className="spacer" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastUpdate && (
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              Actualizado {lastUpdate.toLocaleTimeString('es-GT')} · auto cada 3 min
            </span>
          )}
          <Button variant="secondary" icon="🔄" onClick={cargarPendientes}>
            Actualizar
          </Button>
        </div>
      </div>

      {/* Tabla de vales pendientes (estado 'P') */}
      <div className="table-wrapper">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>No. Mato.</th>
                <th>No. Vale.</th>
                <th>Galones.</th>
                <th>Fecha.</th>
                <th>Nombre Piloto.</th>
                <th>Id Vehículo.</th>
                <th>Id Piloto.</th>
                <th>Manguera.</th>
                <th>Surtidor.</th>
                <th>Estado.</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: 40 }}>Cargando...</td>
                </tr>
              ) : pendientes.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                    No hay vales pendientes en el API.
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
                      <td style={{ fontWeight: 600 }}>{row.api_numero}</td>
                      <td>{row.api_num_vale}</td>
                      <td>{formatNumber(row.api_cant_galones)}</td>
                      <td>{formatDate(row.api_fecha)}</td>
                      <td>{row.api_nombre_piloto || '-'}</td>
                      <td>{row.api_id_vehiculo || '-'}</td>
                      <td>{row.api_id_piloto || '-'}</td>
                      <td>{row.api_manguera ?? '-'}</td>
                      <td>{row.api_surtidor ?? '-'}</td>
                      <td><span className="badge badge-pendiente">Pendiente</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && pendientes.length > 0 && (
          <div className="table-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{pendientes.length} vale(s) pendiente(s)</span>
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

            {/* Datos MATO (solo lectura) */}
            <h4 style={{ margin: '0 0 12px' }}>Datos MATO</h4>
            <dl style={dlStyle}>
              <Dato label="No. Mato" value={selected.api_numero} />
              <Dato label="No. Vale" value={selected.api_num_vale} />
              <Dato label="Galones" value={formatNumber(selected.api_cant_galones)} />
              <Dato label="Fecha" value={formatDate(selected.api_fecha)} />
              <Dato label="Nombre Piloto" value={selected.api_nombre_piloto} />
              <Dato label="Placa" value={selected.api_placa} />
              <Dato label="Licencia" value={selected.api_licencia} />
              <Dato label="Manguera" value={selected.api_manguera} />
              <Dato label="Surtidor" value={selected.api_surtidor} />
              <Dato label="Estado" value="Pendiente" />
            </dl>

            {/* Genera Vale SETRASA */}
            <h4 style={{ margin: '22px 0 12px', paddingTop: 18, borderTop: '1px solid #eceef1' }}>
              Genera Vale SETRASA
            </h4>
            <div className="form-grid">
              <Select
                label="Ubicación (predio)" name="ubicacionFiltro" required className="col-span-2"
                value={ubicacionFiltro}
                onChange={(e) => { setUbicacionFiltro(e.target.value); setForm((prev) => ({ ...prev, idBomba: '', idFactura: '' })); }}
                options={ubicacionOptions}
                placeholder="Seleccione predio..."
              />
              <Select
                label="Transportista" name="idTransportista" required
                value={form.idTransportista}
                onChange={(e) => setField('idTransportista', e.target.value)}
                options={transportistaOptions}
              />
              <Select
                label="Piloto" name="idPiloto" required
                value={form.idPiloto}
                onChange={(e) => setField('idPiloto', e.target.value)}
                options={pilotoOptions}
              />
              <Select
                label="Camión (placa)" name="idCamion" required
                value={form.idCamion}
                onChange={(e) => setField('idCamion', e.target.value)}
                options={camionOptions}
              />
              <Select
                label="Póliza" name="idPoliza" required
                value={form.idPoliza}
                onChange={(e) => setField('idPoliza', e.target.value)}
                options={polizaOptions}
              />
              <Select
                label="Surtidor / Bomba" name="idBomba" required
                value={form.idBomba}
                onChange={(e) => setBomba(e.target.value)}
                options={bombaOptions}
                placeholder={ubicacionActiva ? 'Seleccione...' : 'Seleccione predio primero'}
              />
              <Select
                label="Factura / Vale" name="idFactura" required
                value={form.idFactura}
                onChange={(e) => setField('idFactura', e.target.value)}
                options={facturaOptions}
                placeholder={form.idBomba ? (facturaOptions.length ? 'Seleccione...' : 'Sin factura con saldo') : 'Seleccione bomba primero'}
              />
            </div>

            {/* Resumen galones / precio / total */}
            <div style={resumenStyle}>
              <Resumen label="Galones" value={formatNumber(galones)} />
              <Resumen label="Precio" value={formatCurrency(precio)} />
              <Resumen label="Total" value={formatCurrency(total)} strong />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

/* ---- Subcomponentes de presentación ---- */
const dlStyle = { display: 'grid', gridTemplateColumns: '110px 1fr 110px 1fr', rowGap: 8, columnGap: 16, margin: 0 };
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
      <dt style={{ color: '#6b7280', fontSize: 13 }}>{label}</dt>
      <dd style={{ margin: 0, fontWeight: 500 }}>{value ?? '-'}</dd>
    </>
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
