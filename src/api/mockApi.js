/**
 * mockApi.js
 * Simulación de API en memoria para la fase visual. Mantiene el estado de cada
 * recurso, simula latencia de red y expone operaciones CRUD genéricas:
 *   list, getById, create, update, remove, patchEstado.
 *
 * Cuando exista el backend real, cada service podrá reemplazar las llamadas a
 * mockApi por llamadas a axiosClient sin cambiar las páginas.
 */
import { initialData } from '../data/mockData';

// Clonado profundo para no mutar las semillas originales.
const clone = (v) => JSON.parse(JSON.stringify(v));

// Campo identificador por recurso. Por defecto 'codigo'; procesos usan 'correlativo'.
const ID_FIELD = {
  polizaDetalle: 'correlativo',
  anticipoProvision: 'correlativo',
  detalleFacturas: 'correlativo',
  liquidaciones: 'correlativo',
  bitacoras: 'bitacora_id',
};

// Estado en memoria (se reinicia al refrescar la página).
const store = clone(initialData);

const idFieldOf = (recurso) => ID_FIELD[recurso] || 'codigo';

const delay = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

const nextId = (recurso) => {
  const key = idFieldOf(recurso);
  const list = store[recurso] || [];
  const max = list.reduce((m, item) => Math.max(m, Number(item[key]) || 0), 0);
  return max + 1;
};

export const mockApi = {
  /** Lista todos los registros de un recurso. */
  async list(recurso) {
    await delay();
    return clone(store[recurso] || []);
  },

  /** Obtiene un registro por id. */
  async getById(recurso, id) {
    await delay();
    const key = idFieldOf(recurso);
    const found = (store[recurso] || []).find((it) => String(it[key]) === String(id));
    return found ? clone(found) : null;
  },

  /** Crea un registro nuevo asignando id automático. */
  async create(recurso, data) {
    await delay();
    const key = idFieldOf(recurso);
    const nuevo = { ...data, [key]: nextId(recurso) };
    store[recurso] = [...(store[recurso] || []), nuevo];
    return clone(nuevo);
  },

  /** Actualiza un registro existente por id. */
  async update(recurso, id, data) {
    await delay();
    const key = idFieldOf(recurso);
    store[recurso] = (store[recurso] || []).map((it) =>
      String(it[key]) === String(id) ? { ...it, ...data, [key]: it[key] } : it
    );
    return clone((store[recurso] || []).find((it) => String(it[key]) === String(id)));
  },

  /** Elimina un registro por id. */
  async remove(recurso, id) {
    await delay();
    const key = idFieldOf(recurso);
    store[recurso] = (store[recurso] || []).filter((it) => String(it[key]) !== String(id));
    return { ok: true };
  },

  /** Cambia únicamente el estado de un registro (activar/inactivar/anular). */
  async patchEstado(recurso, id, estado) {
    await delay(160);
    const key = idFieldOf(recurso);
    store[recurso] = (store[recurso] || []).map((it) =>
      String(it[key]) === String(id) ? { ...it, estado } : it
    );
    return clone((store[recurso] || []).find((it) => String(it[key]) === String(id)));
  },

  /** Obtiene un objeto único (p.ej. parámetros, fila única). */
  async getSingle(recurso) {
    await delay();
    return clone(store[recurso]);
  },

  /** Actualiza un objeto único (p.ej. parámetros). */
  async updateSingle(recurso, data) {
    await delay();
    store[recurso] = { ...store[recurso], ...data };
    return clone(store[recurso]);
  },
};

export default mockApi;
