/**
 * realApi.js
 * Cliente HTTP que consume el backend real (Express + MySQL) y expone la MISMA
 * interfaz que el antiguo mockApi (list, getById, create, update, remove,
 * patchEstado, getSingle, updateSingle...), para que hooks y páginas no cambien.
 *
 * Mapea cada "recurso" del frontend a su ruta REST del backend.
 * El backend responde con el sobre { ok, message, data }; aquí se extrae `data`.
 */
import axiosClient from './axiosClient';

// recurso (clave usada en el frontend) -> ruta base en la API
const PATHS = {
  // Seguridad
  usuarios: '/usuarios',
  roles: '/roles',
  usuarioRol: '/usuario-rol',
  // Catálogos
  tipoCamion: '/catalogos/tipo-camion',
  tipoProducto: '/catalogos/tipo-producto',
  tipoAnticipoProvision: '/catalogos/tipo-anticipo-provision',
  ubicacionBomba: '/catalogos/ubicacion-bomba',
  productos: '/catalogos/productos',
  bombas: '/catalogos/bombas',
  tarifaEmbarque: '/catalogos/tarifa-embarque',
  // Configuración
  empresas: '/configuracion/empresas',
  parametros: '/configuracion/parametros',
  // Mantenimientos
  transportistas: '/mantenimientos/transportistas',
  pilotos: '/mantenimientos/pilotos',
  camiones: '/mantenimientos/camiones',
  polizas: '/mantenimientos/polizas',
  facturasVales: '/mantenimientos/facturas-vales',
  // Procesos
  polizaDetalle: '/procesos/poliza-detalle',
  anticipoProvision: '/procesos/anticipo-provision',
  detalleFacturas: '/procesos/detalle-facturas',
  liquidaciones: '/procesos/liquidaciones',
  // Registro de Viajes (Detalle de Póliza / Envíos, con reglas de negocio)
  viajes: '/viajes',
  // Anticipos / Provisión
  anticipos: '/anticipos',
  // Detalle de Factura (vales de combustible manuales, con saldo transaccional)
  detalleFactura: '/detalle-factura',
  // [v5] Descuentos que se restan en la Liquidación
  descuentoAceite: '/procesos/descuento-aceite',
  descuentoAdministrativo: '/procesos/descuento-administrativo',
  // Auditoría
  bitacoras: '/bitacoras',
};

function pathOf(recurso) {
  const p = PATHS[recurso];
  if (!p) throw new Error(`Recurso no mapeado en realApi: ${recurso}`);
  return p;
}

// Extrae el cuerpo `data` del sobre estándar de la API.
const unwrap = (resp) => (resp.data && 'data' in resp.data ? resp.data.data : resp.data);

export const realApi = {
  async list(recurso) {
    return unwrap(await axiosClient.get(pathOf(recurso)));
  },
  async getById(recurso, id) {
    return unwrap(await axiosClient.get(`${pathOf(recurso)}/${id}`));
  },
  async create(recurso, data) {
    return unwrap(await axiosClient.post(pathOf(recurso), data));
  },
  async update(recurso, id, data) {
    return unwrap(await axiosClient.put(`${pathOf(recurso)}/${id}`, data));
  },
  async remove(recurso, id) {
    return unwrap(await axiosClient.delete(`${pathOf(recurso)}/${id}`));
  },
  async patchEstado(recurso, id, estado) {
    return unwrap(await axiosClient.patch(`${pathOf(recurso)}/${id}/estado`, { estado }));
  },
  async changePassword(recurso, id, contrasena) {
    return unwrap(await axiosClient.patch(`${pathOf(recurso)}/${id}/password`, { contrasena }));
  },

  // Recurso de fila única (parámetros)
  async getSingle(recurso) {
    return unwrap(await axiosClient.get(pathOf(recurso)));
  },
  async updateSingle(recurso, data) {
    return unwrap(await axiosClient.put(pathOf(recurso), data));
  },

  // Consultas con query params (p.ej. bitácoras)
  async query(recurso, params = {}) {
    return unwrap(await axiosClient.get(pathOf(recurso), { params }));
  },

  // Registro de Viajes: resumen (saldo de piezas / viajes realizados / pesos) por póliza.
  async viajeResumen(idPoliza) {
    return unwrap(await axiosClient.get(`/viajes/resumen/${idPoliza}`));
  },

  // Registro de Viajes: valida piezas vs saldo y calcula el valor (M2).
  async viajeValidar(body) {
    return unwrap(await axiosClient.post('/viajes/validar', body));
  },

  // Liquidación de pólizas
  async liquidacionResumen(idPoliza) {
    return unwrap(await axiosClient.get(`/liquidacion/resumen/${idPoliza}`));
  },
  async liquidacionConfirmar(idPoliza) {
    return unwrap(await axiosClient.post('/liquidacion/confirmar', { id_poliza: idPoliza }));
  },
  async liquidacionHistorial(params = {}) {
    return unwrap(await axiosClient.get('/liquidacion/historial', { params }));
  },
  async liquidacionDetalle(idPoliza) {
    return unwrap(await axiosClient.get(`/liquidacion/detalle/${idPoliza}`));
  },
  // [v5 §2] Reporte detallado de liquidación (viajes + descuentos + totales por transportista).
  async liquidacionReporte(idPoliza) {
    return unwrap(await axiosClient.get(`/liquidacion/reporte/${idPoliza}`));
  },

  // [v6 §3] Historial (tablas his_*): tipo ∈ det-poliza | val-detalle | anticipo-efectivo.
  async historial(tipo, params = {}) {
    return unwrap(await axiosClient.get(`/historial/${tipo}`, { params }));
  },

  // [v7 §4] Datos del vale de anticipo resueltos en servidor para imprimir.
  async anticipoImpresion(id) {
    return unwrap(await axiosClient.get(`/anticipos/${id}/impresion`));
  },
  // [v7 §5] Reimpresión de vales de anticipo por número de vale y/o placa.
  async anticipoReimpresion(params = {}) {
    return unwrap(await axiosClient.get('/anticipos/reimpresion', { params }));
  },

  // Reporte de diesel por factura
  async reporteDiesel(params = {}) {
    return unwrap(await axiosClient.get('/reportes/diesel', { params }));
  },

  // [v5 §6] Arrastre de pesos/bultos por pólizas y puntos de embarque
  async reporteArrastrePolizas(params = {}) {
    return unwrap(await axiosClient.get('/reportes/arrastre-polizas', { params }));
  },

  // [v5 §7] Reporte de viajes por póliza
  async reporteViajesPoliza(params = {}) {
    return unwrap(await axiosClient.get('/reportes/viajes-poliza', { params }));
  },

  // [v5] Detalle de Factura: datos resueltos en servidor para imprimir el vale.
  async detalleFacturaImpresion(id) {
    return unwrap(await axiosClient.get(`/detalle-factura/${id}/impresion`));
  },

  // [v5] Gráficas del dashboard (agregación en servidor).
  async dashboardFacturaActivaDiesel() {
    return unwrap(await axiosClient.get('/dashboard/factura-activa-diesel'));
  },
  async dashboardPolizaActivaViajes() {
    return unwrap(await axiosClient.get('/dashboard/poliza-activa-viajes'));
  },
};

export default realApi;
