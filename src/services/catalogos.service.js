/**
 * catalogos.service.js
 * Servicio del módulo Catálogos. Hoy delega en mockApi; mañana usará axiosClient
 * sobre ENDPOINTS.catalogos.* (ver api/endpoints.js).
 *
 * La clave de recurso (recursoKey) corresponde a la usada en mockData/mockApi.
 */
import mockApi from '../api/mockApi';
// import axiosClient from '../api/axiosClient';
// import { ENDPOINTS } from '../api/endpoints';

export const catalogosService = {
  list: (recursoKey) => mockApi.list(recursoKey),
  getById: (recursoKey, id) => mockApi.getById(recursoKey, id),
  create: (recursoKey, data) => mockApi.create(recursoKey, data),
  update: (recursoKey, id, data) => mockApi.update(recursoKey, id, data),
  remove: (recursoKey, id) => mockApi.remove(recursoKey, id),

  // Ejemplo de implementación futura con backend real:
  // list: (recurso) => axiosClient.get(ENDPOINTS.catalogos.list(recurso)).then(r => r.data.data),
};

export default catalogosService;
