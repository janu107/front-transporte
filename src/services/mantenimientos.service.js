/**
 * mantenimientos.service.js
 * Servicio del módulo Mantenimientos. Delega en mockApi en esta fase.
 * Futuro: ENDPOINTS.mantenimientos.*
 */
import mockApi from '../api/mockApi';

export const mantenimientosService = {
  list: (recursoKey) => mockApi.list(recursoKey),
  getById: (recursoKey, id) => mockApi.getById(recursoKey, id),
  create: (recursoKey, data) => mockApi.create(recursoKey, data),
  update: (recursoKey, id, data) => mockApi.update(recursoKey, id, data),
  remove: (recursoKey, id) => mockApi.remove(recursoKey, id),
  patchEstado: (recursoKey, id, estado) => mockApi.patchEstado(recursoKey, id, estado),
};

export default mantenimientosService;
