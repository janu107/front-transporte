/**
 * EmptyState.jsx
 * Estado vacío para tablas/listados sin resultados.
 */
import Icon from './Icon';

export function EmptyState({ icon = 'inbox', title = 'Sin registros', message = 'No hay datos para mostrar.' }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon name={icon} size={38} /></div>
      <div className="empty-title">{title}</div>
      <div>{message}</div>
    </div>
  );
}

export default EmptyState;
