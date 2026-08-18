/**
 * SearchableSelect.jsx
 * Select de selección única con búsqueda por texto (sin librerías externas).
 * Accesible con teclado (↑ ↓ Enter Esc) y cierre al hacer clic afuera.
 *
 * Props:
 *  - label, name, value, onChange(value), options: [{value,label}]
 *  - placeholder, required, error, disabled, className
 * onChange recibe el VALUE directamente (no un evento).
 *
 * Notas de comportamiento:
 *  - El campo SIEMPRE muestra la opción elegida hasta que el usuario empieza a
 *    escribir; así no parece que la selección se borró al volver a tocarlo.
 *  - La lista solo pinta un máximo de resultados (MAX_VISIBLES). Con catálogos
 *    grandes (miles de pilotos, camiones o pólizas) renderizarlos todos
 *    congelaba el navegador al abrir el desplegable.
 */
import { useEffect, useMemo, useRef, useState } from 'react';

const MAX_VISIBLES = 50;

const listStyle = {
  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 70,
  background: '#fff', border: '1px solid #d1d5db', borderRadius: 8,
  marginTop: 2, maxHeight: 220, overflowY: 'auto',
  boxShadow: '0 6px 20px rgba(0,0,0,.12)', listStyle: 'none', padding: 4, margin: 0,
};
const avisoStyle = {
  padding: '6px 10px', fontSize: 11.5, color: '#6b7280',
  borderTop: '1px solid #eceef1', background: '#f8f9fb',
  position: 'sticky', bottom: 0,
};

export function SearchableSelect({
  label, name, value, onChange, options = [],
  placeholder = 'Buscar...', required = false, error, disabled = false, className = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  // `escribiendo` distingue "abrí la lista" de "estoy filtrando": mientras no se
  // escriba, el input sigue mostrando la opción ya elegida.
  const [escribiendo, setEscribiendo] = useState(false);
  const [hi, setHi] = useState(0);
  const ref = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find((o) => String(o.value) === String(value)) || null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => String(o.label).toLowerCase().includes(q));
  }, [options, query]);

  // Solo se renderiza un tramo: el resto se alcanza escribiendo.
  const visibles = useMemo(() => filtered.slice(0, MAX_VISIBLES), [filtered]);
  const ocultas = filtered.length - visibles.length;

  const cerrar = () => { setOpen(false); setEscribiendo(false); setQuery(''); };

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) cerrar(); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const choose = (opt, { soltarFoco = true } = {}) => {
    onChange(opt.value);
    cerrar();
    // Se suelta el foco para que la lista no se reabra sola tras elegir. Con
    // Tab no se hace: el navegador ya está llevando el foco al campo siguiente.
    if (soltarFoco) inputRef.current?.blur();
  };

  const onKey = (e) => {
    if (disabled) return;
    // Tab confirma lo que se está filtrando y deja seguir al campo siguiente,
    // para llenar el formulario completo sin soltar el teclado. No se hace
    // preventDefault: el salto de foco lo da el navegador.
    if (e.key === 'Tab') {
      if (open && escribiendo && visibles[hi]) choose(visibles[hi], { soltarFoco: false });
      else cerrar();
      return;
    }
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) { setOpen(true); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, visibles.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (visibles[hi]) choose(visibles[hi]); }
    else if (e.key === 'Escape') { cerrar(); }
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
        ref={inputRef}
        className={`form-control ${error ? 'is-invalid' : ''}`}
        value={escribiendo ? query : (selected ? selected.label : '')}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        onChange={(e) => { setQuery(e.target.value); setEscribiendo(true); setOpen(true); setHi(0); }}
        onFocus={() => { if (!disabled) { setOpen(true); setHi(0); } }}
        // Al salir del campo (con Tab o clic) la lista no debe quedar abierta
        // tapando lo que sigue. El clic en una opción usa onMouseDown, que se
        // adelanta al blur, así que elegir con el ratón sigue funcionando.
        onBlur={cerrar}
        onKeyDown={onKey}
      />
      {open && !disabled && (
        <ul style={listStyle} role="listbox">
          {visibles.length === 0 ? (
            <li style={{ padding: '8px 10px', color: '#9ca3af', fontSize: 13 }}>Sin resultados</li>
          ) : visibles.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={String(o.value) === String(value)}
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
          {ocultas > 0 && (
            <li style={avisoStyle}>
              Mostrando {visibles.length} de {filtered.length}. Escriba para filtrar.
            </li>
          )}
        </ul>
      )}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

export default SearchableSelect;
