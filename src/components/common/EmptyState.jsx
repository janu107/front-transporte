/**
 * EmptyState.jsx
 * Estado vacío para tablas/listados sin resultados.
 */
export function EmptyState({ icon = '📭', title = 'Sin registros', message = 'No hay datos para mostrar.' }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      <div>{message}</div>
    </div>
  );
}

export default EmptyState;
