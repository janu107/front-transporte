/**
 * useCrudMock.js
 * Hook que encapsula el ciclo CRUD contra mockApi para un recurso.
 * Provee: items, loading, message, y acciones load/create/update/remove/patchEstado.
 *
 * Para migrar al backend real basta con cambiar la implementación de mockApi
 * por axiosClient en los services; la interfaz de este hook permanece igual.
 */
import { useState, useEffect, useCallback } from 'react';
import mockApi from '../api/mockApi';

export function useCrudMock(recurso) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }

  const notify = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await mockApi.list(recurso);
      setItems(data);
    } catch (e) {
      notify('error', 'Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  }, [recurso, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(
    async (data) => {
      await mockApi.create(recurso, data);
      await load();
      notify('success', 'Registro creado correctamente.');
    },
    [recurso, load, notify]
  );

  const update = useCallback(
    async (id, data) => {
      await mockApi.update(recurso, id, data);
      await load();
      notify('success', 'Registro actualizado correctamente.');
    },
    [recurso, load, notify]
  );

  const remove = useCallback(
    async (id) => {
      await mockApi.remove(recurso, id);
      await load();
      notify('success', 'Registro eliminado correctamente.');
    },
    [recurso, load, notify]
  );

  const patchEstado = useCallback(
    async (id, estado) => {
      await mockApi.patchEstado(recurso, id, estado);
      await load();
      notify('success', `Estado cambiado a ${estado}.`);
    },
    [recurso, load, notify]
  );

  return { items, loading, message, load, create, update, remove, patchEstado, notify };
}

export default useCrudMock;
