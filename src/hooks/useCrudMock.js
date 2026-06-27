/**
 * useCrudMock.js
 * Hook que encapsula el ciclo CRUD de un recurso contra el backend real (realApi).
 * Conserva el nombre por compatibilidad con las páginas existentes.
 *
 * Provee: items, loading, message y acciones load/create/update/remove/patchEstado/changePassword.
 */
import { useState, useEffect, useCallback } from 'react';
import realApi from '../api/realApi';
import logger from '../utils/logger';

// Extrae un mensaje de error legible de la respuesta de axios.
function errMsg(e, fallback) {
  return e?.userMessage || e?.response?.data?.message || e?.message || fallback;
}

export function useCrudMock(recurso) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }

  const notify = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    logger.debug('CRUD carga iniciada', { recurso });
    try {
      const rows = await realApi.list(recurso);
      setItems(rows);
      logger.info('CRUD carga completada', { recurso, registros: rows.length });
    } catch (e) {
      logger.error('CRUD carga fallida', { recurso, error: e });
      notify('error', errMsg(e, 'Error al cargar los datos.'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [recurso, notify]);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(
    async (data) => {
      logger.info('CRUD creación iniciada', { recurso });
      try {
        await realApi.create(recurso, data);
        await load();
        logger.info('CRUD creación completada', { recurso });
        notify('success', 'Registro creado correctamente.');
      } catch (e) {
        logger.error('CRUD creación fallida', { recurso, error: e });
        notify('error', errMsg(e, 'No se pudo crear el registro.'));
        throw e;
      }
    },
    [recurso, load, notify]
  );

  const update = useCallback(
    async (id, data) => {
      logger.info('CRUD actualización iniciada', { recurso, id });
      try {
        await realApi.update(recurso, id, data);
        await load();
        logger.info('CRUD actualización completada', { recurso, id });
        notify('success', 'Registro actualizado correctamente.');
      } catch (e) {
        logger.error('CRUD actualización fallida', { recurso, id, error: e });
        notify('error', errMsg(e, 'No se pudo actualizar el registro.'));
        throw e;
      }
    },
    [recurso, load, notify]
  );

  const remove = useCallback(
    async (id) => {
      logger.info('CRUD eliminación iniciada', { recurso, id });
      try {
        await realApi.remove(recurso, id);
        await load();
        logger.info('CRUD eliminación completada', { recurso, id });
        notify('success', 'Registro eliminado correctamente.');
      } catch (e) {
        logger.error('CRUD eliminación fallida', { recurso, id, error: e });
        notify('error', errMsg(e, 'No se pudo eliminar el registro.'));
      }
    },
    [recurso, load, notify]
  );

  const patchEstado = useCallback(
    async (id, estado) => {
      logger.info('CRUD cambio de estado iniciado', { recurso, id, estado });
      try {
        await realApi.patchEstado(recurso, id, estado);
        await load();
        logger.info('CRUD cambio de estado completado', { recurso, id, estado });
        notify('success', `Estado cambiado a ${estado}.`);
      } catch (e) {
        logger.error('CRUD cambio de estado fallido', { recurso, id, estado, error: e });
        notify('error', errMsg(e, 'No se pudo cambiar el estado.'));
      }
    },
    [recurso, load, notify]
  );

  const changePassword = useCallback(
    async (id, contrasena) => {
      logger.info('CRUD cambio de contraseña iniciado', { recurso, id });
      try {
        await realApi.changePassword(recurso, id, contrasena);
        logger.info('CRUD cambio de contraseña completado', { recurso, id });
        notify('success', 'Contraseña actualizada correctamente.');
      } catch (e) {
        logger.error('CRUD cambio de contraseña fallido', { recurso, id, error: e });
        notify('error', errMsg(e, 'No se pudo cambiar la contraseña.'));
        throw e;
      }
    },
    [recurso, notify]
  );

  return { items, loading, message, load, create, update, remove, patchEstado, changePassword, notify };
}

export default useCrudMock;
