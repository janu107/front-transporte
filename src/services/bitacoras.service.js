/**
 * bitacoras.service.js
 * Servicio del módulo Bitácoras / Auditoría. Delega en mockApi en esta fase.
 * Futuro: ENDPOINTS.bitacoras.list con filtros por query.
 */
import mockApi from '../api/mockApi';

export const bitacorasService = {
  /** Lista las bitácoras aplicando filtros simples en memoria. */
  async list(filtros = {}) {
    const data = await mockApi.list('bitacoras');
    return data.filter((b) => {
      if (filtros.modulo && !String(b.modulo).toLowerCase().includes(filtros.modulo.toLowerCase())) return false;
      if (filtros.operacion && b.operacion !== filtros.operacion) return false;
      if (filtros.usuario && !String(b.usuario_accion).toLowerCase().includes(filtros.usuario.toLowerCase())) return false;
      if (filtros.fechaInicio && b.fecha_hora_accion < filtros.fechaInicio) return false;
      if (filtros.fechaFin && b.fecha_hora_accion > `${filtros.fechaFin} 23:59:59`) return false;
      return true;
    });
  },
};

export default bitacorasService;
