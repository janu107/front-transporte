/**
 * Button.jsx
 * Botón reutilizable con variantes de estilo.
 * variant: 'primary' | 'secondary' | 'teal' | 'danger' | 'ghost'
 * loading: opcional — muestra un spinner y deshabilita el botón sin
 * cambiar su ancho (el contenido se mantiene en el layout, solo se oculta).
 */
export function Button({
  children,
  variant = 'primary',
  type = 'button',
  block = false,
  size,
  icon,
  loading = false,
  disabled = false,
  className = '',
  ...rest
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    block ? 'btn-block' : '',
    size === 'sm' ? 'btn-sm' : '',
    loading ? 'btn-loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
      {loading && <span className="btn-spinner" aria-hidden="true" />}
    </button>
  );
}

export default Button;
