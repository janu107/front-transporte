/**
 * useRelated.js
 * Carga en memoria varias listas relacionadas (para selects de formularios).
 * Recibe un objeto { alias: recursoKey } y devuelve { alias: [items] }.
 *
 * Ejemplo: const rel = useRelated({ transportistas: 'transportistas' });
 *          rel.transportistas -> [...]
 */
import { useState, useEffect } from 'react';
import realApi from '../api/realApi';

export function useRelated(map = {}) {
  const [data, setData] = useState(() =>
    Object.keys(map).reduce((acc, k) => ({ ...acc, [k]: [] }), {})
  );

  const keysSignature = JSON.stringify(map);

  useEffect(() => {
    let active = true;
    (async () => {
      const entries = await Promise.all(
        Object.entries(map).map(async ([alias, recurso]) => {
          try {
            return [alias, await realApi.list(recurso)];
          } catch {
            return [alias, []];
          }
        })
      );
      if (active) {
        setData(Object.fromEntries(entries));
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keysSignature]);

  return data;
}

/** Convierte una lista en opciones { value, label } para <Select>. */
export function toOptions(list = [], { value = 'codigo', label = 'descripcion', labelFn } = {}) {
  return list.map((it) => ({
    value: it[value],
    label: labelFn ? labelFn(it) : it[label],
  }));
}

export default useRelated;
