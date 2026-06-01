/**
 * Select.jsx
 * Select controlado con etiqueta, opciones, placeholder y mensaje de error.
 * options: [{ value, label }]
 */
export function Select({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  error,
  placeholder = 'Seleccione...',
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
      <select
        id={name}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        className={`form-control ${error ? 'is-invalid' : ''}`}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

export default Select;
