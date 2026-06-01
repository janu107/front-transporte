/**
 * PageHeader.jsx
 * Cabecera de página: título, descripción y botón de acción principal opcional.
 */
import Button from '../common/Button';

export function PageHeader({ title, description, actionLabel, onAction, actionIcon = '➕' }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actionLabel && (
        <Button variant="teal" icon={actionIcon} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default PageHeader;
