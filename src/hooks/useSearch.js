/**
 * useSearch.js
 * Hook de búsqueda simple en memoria sobre una lista de objetos.
 * Filtra por coincidencia de texto en los campos indicados (o todos si no se pasan).
 * Cada campo puede ser el nombre de una propiedad (string) o una función
 * (item) => texto — útil para buscar por valores "lookup" (ej. nombre del
 * transportista a partir de su id).
 */
import { useState, useMemo } from 'react';

export function useSearch(items = [], fields = null) {
  const [term, setTerm] = useState('');

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return items;
    return items.filter((item) => {
      const keys = fields || Object.keys(item);
      return keys.some((k) => {
        const val = typeof k === 'function' ? k(item) : item[k];
        return String(val ?? '').toLowerCase().includes(t);
      });
    });
  }, [items, term, fields]);

  return { term, setTerm, filtered, clear: () => setTerm('') };
}

export default useSearch;
