/**
 * Button.jsx
 * Botón reutilizable con variantes de estilo.
 * variant: 'primary' | 'secondary' | 'teal' | 'danger' | 'ghost'
 */
export function Button({
  children,
  variant = 'primary',
  type = 'button',
  block = false,
  size,
  icon,
  className = '',
  ...rest
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    block ? 'btn-block' : '',
    size === 'sm' ? 'btn-sm' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} {...rest}>
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
}

export default Button;
