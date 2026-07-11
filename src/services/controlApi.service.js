/**
 * controlApi.service.js
 * Servicio del módulo CONTROL DEL API (Confirmación de Vales - Enlace MATO).
 * Consume el backend real vía axiosClient sobre ENDPOINTS.controlApi.*
 */
import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

// Extrae el cuerpo `data` del sobre estándar { ok, message, data }.
const unwrap = (resp) => (resp.data && 'data' in resp.data ? resp.data.data : resp.data);

export const controlApiService = {
  /** Lista los vales en estado 'P' (Pendiente) que alimenta combustible-api. */
  async listarPendientes() {
    return unwrap(await axiosClient.get(ENDPOINTS.controlApi.pendientes));
  },

  /**
   * Asigna (o limpia) el predio/ubicación de un vale.
   * @param {number} apiId
   * @param {number|null} idUbicacion  cat_ubicacion_bomba.codigo (o '' / null para limpiar)
   */
  async asignarUbicacion(apiId, idUbicacion) {
    return unwrap(
      await axiosClient.patch(ENDPOINTS.controlApi.asignarUbicacion(apiId), {
        id_ubicacion: idUbicacion === '' ? null : idUbicacion,
      })
    );
  },

  /**
   * Confirma un despacho ejecutando sp_confirmar_despacho_api.
   * @param {object} payload { api_id, id_piloto, id_camion, id_transportista, id_producto, id_bomba }
   * @returns {Promise<{det1, det2, hubo_cruce, mensaje}>}
   */
  async confirmar(payload) {
    return unwrap(await axiosClient.post(ENDPOINTS.controlApi.confirmar, payload));
  },
};

export default controlApiService;
