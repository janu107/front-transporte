/**
 * SearchBar.jsx
 * Caja de búsqueda con ícono. Controlada por props value/onChange.
 */
import Icon from './Icon';

export function SearchBar({ value, onChange, placeholder = 'Buscar...' }) {
  return (
    <div className="search-input">
      <span className="search-icon" aria-hidden="true"><Icon name="search" size={19} /></span>
      <input
        type="text"
        className="form-control"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}

export default SearchBar;
