/**
 * DataTable.jsx
 * Tabla de datos reutilizable y responsive.
 *
 * Props:
 *  - columns: [{ key, label, render?(value,row), className? }]
 *  - data: array de registros
 *  - loading: boolean
 *  - renderActions: (row) => JSX  (columna de acciones opcional)
 *  - idField: campo identificador (default 'codigo')
 *  - emptyTitle / emptyMessage
 *  - paginated: pagina en cliente (default true)
 *  - pageSize: registros por página (default 25)
 *
 * [2026-08 §1/§3] Paginación de 25 en 25. Los datos se reciben ya ordenados del
 * más reciente al más antiguo (el backend lista por PK/correlativo DESC), por lo
 * que la primera página muestra siempre lo más nuevo.
 */
import { useEffect, useMemo, useState } from 'react';
import EmptyState from './EmptyState';

export function DataTable({
  columns = [],
  data = [],
  loading = false,
  renderActions,
  idField = 'codigo',
  emptyTitle = 'Sin registros',
  emptyMessage = 'No se encontraron datos.',
  paginated = true,
  pageSize = 25,
}) {
  const [page, setPage] = useState(1);
  const total = data.length;
  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));

  // Si cambia el volumen (p. ej. al buscar/filtrar) se ajusta a una página válida.
  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), Math.max(1, Math.ceil(total / pageSize))));
  }, [total, pageSize]);

  const visibles = useMemo(() => {
    if (!paginated) return data;
    const inicio = (page - 1) * pageSize;
    return data.slice(inicio, inicio + pageSize);
  }, [data, paginated, page, pageSize]);

  const desde = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const hasta = Math.min(page * pageSize, total);
  const colCount = columns.length + (renderActions ? 1 : 0);

  return (
    <div className="table-wrapper">
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={col.className}>
                  {col.label}
                </th>
              ))}
              {renderActions && <th className="col-actions">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colCount} style={{ textAlign: 'center', padding: 40 }}>
                  Cargando...
                </td>
              </tr>
            ) : total === 0 ? (
              <tr>
                <td colSpan={colCount}>
                  <EmptyState title={emptyTitle} message={emptyMessage} />
                </td>
              </tr>
            ) : (
              visibles.map((row) => (
                <tr key={row[idField]}>
                  {columns.map((col) => (
                    <td key={col.key} className={col.className}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '-')}
                    </td>
                  ))}
                  {renderActions && <td className="col-actions">{renderActions(row)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && total > 0 && (
        <div className="table-footer">
          <span>
            {paginated && total > pageSize
              ? `Mostrando ${desde}–${hasta} de ${total} registro(s)`
              : `${total} registro(s)`}
          </span>
          {paginated && totalPaginas > 1 && (
            <div className="table-pager">
              <button type="button" className="pager-btn" onClick={() => setPage(1)} disabled={page <= 1} title="Primera">«</button>
              <button type="button" className="pager-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>‹ Anterior</button>
              <span className="pager-info">Página {page} de {totalPaginas}</span>
              <button type="button" className="pager-btn" onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))} disabled={page >= totalPaginas}>Siguiente ›</button>
              <button type="button" className="pager-btn" onClick={() => setPage(totalPaginas)} disabled={page >= totalPaginas} title="Última">»</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DataTable;
