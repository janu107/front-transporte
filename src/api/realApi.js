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
};

export default realApi;
