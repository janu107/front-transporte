/**
 * Input.jsx
 * Campo de entrada controlado con etiqueta, marca de obligatorio y mensaje de error.
 */
export function Input({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  error,
  placeholder,
  className = '',
  ...rest
}) {
  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label className="form-label" htmlFor={name}>
          {label}
          {required && <span className="req">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        className={`form-control ${error ? 'is-invalid' : ''}`}
        {...rest}
      />
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

export default Input;
