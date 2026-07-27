/**
 * SearchableSelect.jsx
 * Select de selección única con búsqueda por texto (sin librerías externas).
 * Accesible con teclado (↑ ↓ Enter Esc) y cierre al hacer clic afuera.
 *
 * Props:
 *  - label, name, value, onChange(value), options: [{value,label}]
 *  - placeholder, required, error, disabled, className
 * onChange recibe el VALUE directamente (no un evento).
 */
import { useEffect, useMemo, useRef, useState } from 'react';

const listStyle = {
  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 70,
  background: '#fff', border: '1px solid #d1d5db', borderRadius: 8,
  marginTop: 2, maxHeight: 220, overflowY: 'auto',
  boxShadow: '0 6px 20px rgba(0,0,0,.12)', listStyle: 'none', padding: 4, margin: 0,
};

export function SearchableSelect({
  label, name, value, onChange, options = [],
  placeholder = 'Buscar...', required = false, error, disabled = false, className = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hi, setHi] = useState(0);
  const ref = useRef(null);

  const selected = options.find((o) => String(o.value) === String(value)) || null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => String(o.label).toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const choose = (opt) => { onChange(opt.value); setOpen(false); setQuery(''); };

  const onKey = (e) => {
    if (disabled) return;
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) { setOpen(true); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[hi]) choose(filtered[hi]); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <div className={`form-field ${className}`} ref={ref} style={{ position: 'relative' }}>
      {label && (
        <label className="form-label" htmlFor={name}>
          {label}{required && <span className="req">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        className={`form-control ${error ? 'is-invalid' : ''}`}
        value={open ? query : (selected ? selected.label : '')}
        placeholder={selected ? selected.label : placeholder}
        disabled={disabled}
        autoComplete="off"
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setHi(0); }}
        onFocus={() => { if (!disabled) { setOpen(true); setQuery(''); } }}
        onKeyDown={onKey}
      />
      {open && !disabled && (
        <ul style={listStyle}>
          {filtered.length === 0 ? (
            <li style={{ padding: '8px 10px', color: '#9ca3af', fontSize: 13 }}>Sin resultados</li>
          ) : filtered.map((o, i) => (
            <li
              key={o.value}
              onMouseDown={(e) => { e.preventDefault(); choose(o); }}
              onMouseEnter={() => setHi(i)}
              style={{
                padding: '7px 10px', cursor: 'pointer', fontSize: 13, borderRadius: 6,
                background: i === hi ? 'rgba(193,18,31,0.10)' : (String(o.value) === String(value) ? '#f3f4f6' : '#fff'),
              }}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

export default SearchableSelect;
