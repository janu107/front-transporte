/**
 * useCrudMock.js
 * Hook que encapsula el ciclo CRUD de un recurso contra el backend real (realApi).
 * Conserva el nombre por compatibilidad con las páginas existentes.
 *
 * Provee: items, loading, message y acciones load/create/update/remove/patchEstado/changePassword.
 */
import { useState, useEffect, useCallback } from 'react';
import realApi from '../api/realApi';

// Extrae un mensaje de error legible de la respuesta de axios.
function errMsg(e, fallback) {
  return e?.response?.data?.message || e?.message || fallback;
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
    try {
      setItems(await realApi.list(recurso));
    } catch (e) {
      notify('error', errMsg(e, 'Error al cargar los datos.'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [recurso, notify]);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(
    async (data) => {
      try {
        await realApi.create(recurso, data);
        await load();
        notify('success', 'Registro creado correctamente.');
      } catch (e) {
        notify('error', errMsg(e, 'No se pudo crear el registro.'));
        throw e;
      }
    },
    [recurso, load, notify]
  );

  const update = useCallback(
    async (id, data) => {
      try {
        await realApi.update(recurso, id, data);
        await load();
        notify('success', 'Registro actualizado correctamente.');
      } catch (e) {
        notify('error', errMsg(e, 'No se pudo actualizar el registro.'));
        throw e;
      }
    },
    [recurso, load, notify]
  );

  const remove = useCallback(
    async (id) => {
      try {
        await realApi.remove(recurso, id);
        await load();
        notify('success', 'Registro eliminado correctamente.');
      } catch (e) {
        notify('error', errMsg(e, 'No se pudo eliminar el registro.'));
      }
    },
    [recurso, load, notify]
  );

  const patchEstado = useCallback(
    async (id, estado) => {
      try {
        await realApi.patchEstado(recurso, id, estado);
        await load();
        notify('success', `Estado cambiado a ${estado}.`);
      } catch (e) {
        notify('error', errMsg(e, 'No se pudo cambiar el estado.'));
      }
    },
    [recurso, load, notify]
  );

  const changePassword = useCallback(
    async (id, contrasena) => {
      try {
        await realApi.changePassword(recurso, id, contrasena);
        notify('success', 'Contraseña actualizada correctamente.');
      } catch (e) {
        notify('error', errMsg(e, 'No se pudo cambiar la contraseña.'));
        throw e;
      }
    },
    [recurso, notify]
  );

  return { items, loading, message, load, create, update, remove, patchEstado, changePassword, notify };
}

export default useCrudMock;
