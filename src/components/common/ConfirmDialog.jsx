/**
 * ConfirmDialog.jsx
 * Diálogo de confirmación para eliminar/anular. Reutiliza Modal.
 */
import Modal from './Modal';
import Button from './Button';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar acción',
  message = '¿Está seguro de realizar esta acción?',
  confirmText = 'Eliminar',
  confirmVariant = 'danger',
  icon = '⚠️',
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div style={{ textAlign: 'center' }}>
        <div className="confirm-icon">{icon}</div>
        <p className="confirm-text">{message}</p>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
