/**
 * usePagination.js — [2026-08 §1/§3] Paginación en cliente de 25 en 25 (por defecto)
 * para las pantallas que arman su propia <table> (no usan el componente DataTable).
 * Los datos llegan ya ordenados del más reciente al más antiguo (backend ORDER BY
 * PK/correlativo DESC), por lo que la primera página muestra lo más nuevo.
 */
import { useEffect, useMemo, useState } from 'react';

export default function usePagination(items = [], pageSize = 25) {
  const [page, setPage] = useState(1);
  const total = items.length;
  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));

  // Reinicia a una página válida cuando cambia el total (p. ej. al buscar/filtrar).
  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), Math.max(1, Math.ceil(total / pageSize))));
  }, [total, pageSize]);

  const visibles = useMemo(() => {
    const inicio = (page - 1) * pageSize;
    return items.slice(inicio, inicio + pageSize);
  }, [items, page, pageSize]);

  const desde = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const hasta = Math.min(page * pageSize, total);

  return { page, setPage, total, totalPaginas, visibles, desde, hasta, pageSize };
}
