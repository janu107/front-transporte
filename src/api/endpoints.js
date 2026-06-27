/**
 * endpoints.js
 * Constantes de endpoints del backend futuro. Centraliza todas las rutas de la API
 * para que la conexión real (axiosClient) solo tenga que referenciarlas.
 *
 * Base configurable por variable de entorno VITE_API_URL.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

export const ENDPOINTS = {
  // Auth
  auth: {
    login: '/auth/login', // POST
    me: '/auth/me', // GET
    logout: '/auth/logout', // POST
  },

  // Seguridad
  usuarios: {
    list: '/usuarios', // GET
    create: '/usuarios', // POST
    update: (id) => `/usuarios/${id}`, // PUT
    estado: (id) => `/usuarios/${id}/estado`, // PATCH
    password: (id) => `/usuarios/${id}/password`, // PATCH
  },
  roles: {
    list: '/roles', // GET
    create: '/roles', // POST
    update: (id) => `/roles/${id}`, // PUT
    estado: (id) => `/roles/${id}/estado`, // PATCH
  },
  usuarioRol: {
    list: '/usuario-rol', // GET
    create: '/usuario-rol', // POST
    update: (id) => `/usuario-rol/${id}`, // PUT
    estado: (id) => `/usuario-rol/${id}/estado`, // PATCH
  },

  // Catálogos (recurso: tipo-camion | tipo-producto | tipo-anticipo-provision |
  // ubicacion-bomba | productos | bombas | tarifa-embarque)
  catalogos: {
    list: (recurso) => `/catalogos/${recurso}`, // GET
    create: (recurso) => `/catalogos/${recurso}`, // POST
    update: (recurso, id) => `/catalogos/${recurso}/${id}`, // PUT
    remove: (recurso, id) => `/catalogos/${recurso}/${id}`, // DELETE
  },

  // Configuración
  configuracion: {
    empresas: '/configuracion/empresas', // GET / POST
    empresa: (id) => `/configuracion/empresas/${id}`, // PUT / DELETE
    parametros: '/configuracion/parametros', // GET / PUT
  },

  // Mantenimientos (recurso: transportistas | pilotos | camiones | polizas | facturas-vales)
  mantenimientos: {
    list: (recurso) => `/mantenimientos/${recurso}`,
    create: (recurso) => `/mantenimientos/${recurso}`,
    update: (recurso, id) => `/mantenimientos/${recurso}/${id}`,
    remove: (recurso, id) => `/mantenimientos/${recurso}/${id}`,
  },

  // Procesos (recurso: poliza-detalle | anticipo-provision | detalle-facturas | liquidaciones)
  procesos: {
    list: (recurso) => `/procesos/${recurso}`,
    create: (recurso) => `/procesos/${recurso}`,
    update: (recurso, id) => `/procesos/${recurso}/${id}`,
    remove: (recurso, id) => `/procesos/${recurso}/${id}`,
  },

  // Control del API (Confirmación de Vales)
  controlApi: {
    pendientes: '/control-api/pendientes', // GET
    confirmar: '/control-api/confirmar', // POST
  },

  // Bitácoras
  bitacoras: {
    list: '/bitacoras', // GET con query params (modulo, operacion, usuario, fechaInicio, fechaFin)
  },
};

export default ENDPOINTS;
