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
 */
import EmptyState from './EmptyState';

export function DataTable({
  columns = [],
  data = [],
  loading = false,
  renderActions,
  idField = 'codigo',
  emptyTitle = 'Sin registros',
  emptyMessage = 'No se encontraron datos.',
}) {
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
                <td colSpan={columns.length + (renderActions ? 1 : 0)} style={{ textAlign: 'center', padding: 40 }}>
                  Cargando...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (renderActions ? 1 : 0)}>
                  <EmptyState title={emptyTitle} message={emptyMessage} />
                </td>
              </tr>
            ) : (
              data.map((row) => (
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
      {!loading && data.length > 0 && (
        <div className="table-footer">
          <span>{data.length} registro(s)</span>
        </div>
      )}
    </div>
  );
}

export default DataTable;
