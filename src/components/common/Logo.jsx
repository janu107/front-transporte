/**
 * Logo.jsx
 * Logo oficial de SETRASA, reutilizable en pantalla e impresiones.
 * Usa el recurso público setrasa-logo.png (una sola copia del asset).
 */
export const LOGO_SRC = `${import.meta.env.BASE_URL}setrasa-logo.png`;

// URL absoluta (para ventanas de impresión que se abren en about:blank).
export const logoAbsUrl = () => `${window.location.origin}${import.meta.env.BASE_URL}setrasa-logo.png`;

export function Logo({ height, className = '', alt = 'SETRASA' }) {
  // Solo fija el alto cuando se indica explícitamente (p.ej. el ícono compacto
  // del sidebar); el ancho queda libre para que el navegador conserve la
  // proporción real del logo (evita deformarlo). Si no se pasa `height`, el
  // tamaño lo controla el CSS del contenedor (p.ej. el logo grande del login).
  const style = { maxWidth: '100%', objectFit: 'contain' };
  if (height) style.height = height;
  return <img src={LOGO_SRC} alt={alt} className={className} style={style} />;
}

export default Logo;
