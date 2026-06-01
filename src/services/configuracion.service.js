/**
 * configuracion.service.js
 * Servicio del módulo Configuración (empresas y parámetros).
 * Delega en mockApi en esta fase; futuro: ENDPOINTS.configuracion.*
 */
import mockApi from '../api/mockApi';

export const configuracionService = {
  // Empresas
  listEmpresas: () => mockApi.list('empresas'),
  createEmpresa: (data) => mockApi.create('empresas', data),
  updateEmpresa: (id, data) => mockApi.update('empresas', id, data),
  removeEmpresa: (id) => mockApi.remove('empresas', id),

  // Parámetros (fila única)
  getParametros: () => mockApi.getSingle('parametros'),
  updateParametros: (data) => mockApi.updateSingle('parametros', data),
};

export default configuracionService;
