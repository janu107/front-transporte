/**
 * Logo.jsx
 * Logo oficial de SETRASA, reutilizable en pantalla e impresiones.
 * Usa el recurso público setrasa-logo.svg (una sola copia del asset).
 */
export const LOGO_SRC = `${import.meta.env.BASE_URL}setrasa-logo.svg`;

// URL absoluta (para ventanas de impresión que se abren en about:blank).
export const logoAbsUrl = () => `${window.location.origin}${import.meta.env.BASE_URL}setrasa-logo.svg`;

export function Logo({ height = 40, className = '', alt = 'SETRASA' }) {
  return (
    <img
      src={LOGO_SRC}
      alt={alt}
      className={className}
      style={{ height, width: 'auto', maxWidth: '100%', objectFit: 'contain' }}
    />
  );
}

export default Logo;
