/**
 * RowActions.jsx
 * Botones de acción por fila (ver, editar, eliminar/anular y acciones extra).
 * Pasar solo los handlers que apliquen.
 */
import Icon from './Icon';

export function RowActions({ onView, onEdit, onDelete, deleteIcon = 'delete', deleteTitle = 'Eliminar', extra }) {
  return (
    <div className="row-actions">
      {extra}
      {onView && (
        <button type="button" className="icon-btn view" title="Ver detalle" aria-label="Ver detalle" onClick={onView}>
          <Icon name="view" size={19} />
        </button>
      )}
      {onEdit && (
        <button type="button" className="icon-btn edit" title="Editar" aria-label="Editar" onClick={onEdit}>
          <Icon name="edit" size={19} />
        </button>
      )}
      {onDelete && (
        <button type="button" className="icon-btn danger" title={deleteTitle} aria-label={deleteTitle} onClick={onDelete}>
          <Icon name={deleteIcon} size={19} />
        </button>
      )}
    </div>
  );
}

export default RowActions;
