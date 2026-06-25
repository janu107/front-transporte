/**
 * configuracion.service.js
 * Servicio del módulo Configuración (empresas y parámetros) contra el backend real.
 */
import realApi from '../api/realApi';

export const configuracionService = {
  // Empresas
  listEmpresas: () => realApi.list('empresas'),
  createEmpresa: (data) => realApi.create('empresas', data),
  updateEmpresa: (id, data) => realApi.update('empresas', id, data),
  removeEmpresa: (id) => realApi.remove('empresas', id),

  // Parámetros (fila única)
  getParametros: () => realApi.getSingle('parametros'),
  updateParametros: (data) => realApi.updateSingle('parametros', data),
};

export default configuracionService;
