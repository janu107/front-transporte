/**
 * Modal.jsx
 * Modal genérico para crear/editar. Título dinámico, contenido y footer por props.
 * size: 'sm' | 'md' (default) | 'lg'
 *
 * En móvil (≤640px) se convierte en una hoja (bottom-sheet) casi de pantalla
 * completa vía CSS (forms.css); el comportamiento y las props no cambian.
 * Accesibilidad: al abrir enfoca el diálogo, al cerrar devuelve el foco al
 * elemento que lo abrió (ver forms.css .modal-overlay / .modal).
 */
import { useEffect, useRef } from 'react';

let modalIdSeq = 0;

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const titleId = useRef(`modal-title-${(modalIdSeq += 1)}`);

  useEffect(() => {
    if (!isOpen) return undefined;
    triggerRef.current = document.activeElement;
    // Enfoca el diálogo al abrir (accesible por teclado desde ya).
    dialogRef.current?.focus();

    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      // Devuelve el foco al control que abrió el modal (si sigue en el DOM).
      if (triggerRef.current && document.contains(triggerRef.current)) {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = size === 'lg' ? 'modal-lg' : size === 'sm' ? 'modal-sm' : '';

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className={`modal ${sizeClass}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        tabIndex={-1}
        ref={dialogRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id={titleId.current}>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;
