/**
 * useSearch.js
 * Hook de búsqueda simple en memoria sobre una lista de objetos.
 * Filtra por coincidencia de texto en los campos indicados (o todos si no se pasan).
 */
import { useState, useMemo } from 'react';

export function useSearch(items = [], fields = null) {
  const [term, setTerm] = useState('');

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return items;
    return items.filter((item) => {
      const keys = fields || Object.keys(item);
      return keys.some((k) => String(item[k] ?? '').toLowerCase().includes(t));
    });
  }, [items, term, fields]);

  return { term, setTerm, filtered, clear: () => setTerm('') };
}

export default useSearch;
