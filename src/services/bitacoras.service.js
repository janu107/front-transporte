/**
 * bitacoras.service.js
 * Servicio del módulo Bitácoras / Auditoría contra el backend real.
 * El filtrado se realiza en el servidor mediante query params.
 */
import realApi from '../api/realApi';

export const bitacorasService = {
  /** Lista las bitácoras aplicando filtros (modulo, operacion, usuario, fechaInicio, fechaFin). */
  async list(filtros = {}) {
    // Limpia parámetros vacíos para no enviarlos
    const params = Object.fromEntries(
      Object.entries(filtros).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    );
    return realApi.query('bitacoras', params);
  },
};

export default bitacorasService;
