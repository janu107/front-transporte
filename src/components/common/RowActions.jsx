/**
 * RowActions.jsx
 * Botones de acción por fila (ver, editar, eliminar/anular y acciones extra).
 * Pasar solo los handlers que apliquen.
 */
export function RowActions({ onView, onEdit, onDelete, deleteIcon = '🗑️', deleteTitle = 'Eliminar', extra }) {
  return (
    <div className="row-actions">
      {extra}
      {onView && (
        <button type="button" className="icon-btn view" title="Ver detalle" aria-label="Ver detalle" onClick={onView}>
          👁️
        </button>
      )}
      {onEdit && (
        <button type="button" className="icon-btn edit" title="Editar" aria-label="Editar" onClick={onEdit}>
          ✏️
        </button>
      )}
      {onDelete && (
        <button type="button" className="icon-btn danger" title={deleteTitle} aria-label={deleteTitle} onClick={onDelete}>
          {deleteIcon}
        </button>
      )}
    </div>
  );
}

export default RowActions;
