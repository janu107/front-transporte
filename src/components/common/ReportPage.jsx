/**
 * ReportPage.jsx
 * [v5 §4] Componente reutilizable para los reportes de solo lectura de
 * catálogos y mantenimientos: encabezado, buscador, filtro de estado
 * (opcional), tabla con paginación, estado vacío/carga y botón Imprimir.
 * Reutiliza useSearch (campos-función) y el mismo logo/estilo del sistema.
 *
 * Props:
 *  - title, description
 *  - recurso: clave de realApi.list(recurso)
 *  - columns: [{ key, label, render?: (row)=>ReactNode, print?: (row)=>string }]
 *      `print` (o `render` si no hay `print`) alimenta la impresión.
 *  - searchFields: campos para useSearch (strings o funciones)
 *  - hasEstado: si true, agrega un filtro por estado (usa los valores reales
 *      presentes en los datos, no una lista fija).
 *  - usuario: nombre del usuario en sesión (para el encabezado impreso).
 *  - pageSize: tamaño de página (default 20).
 *  - enrich: (items) => Promise<items> opcional, para agregar columnas
 *      calculadas (ej. conteo de viajes por póliza) sin duplicar el fetch.
 */
import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../layout/PageHeader';
import Button from './Button';
import SearchBar from './SearchBar';
import useSearch from '../../hooks/useSearch';
import realApi from '../../api/realApi';
import { imprimirReporteGenerico } from '../../utils/impresionDocs';

export function ReportPage({
  title, description, recurso, columns, searchFields, hasEstado = false, usuario = '', pageSize = 20, enrich,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    let vivo = true;
    (async () => {
      setLoading(true); setError(null);
      try {
        let data = await realApi.list(recurso);
        if (enrich) data = await enrich(data);
        if (vivo) setItems(data);
      } catch (e) {
        if (vivo) setError(e?.userMessage || e?.response?.data?.message || 'No se pudo cargar el reporte.');
      } finally {
        if (vivo) setLoading(false);
      }
    })();
    return () => { vivo = false; };
  }, [recurso]);

  const { term, setTerm, filtered } = useSearch(items, searchFields);

  const estadosDisponibles = useMemo(
    () => (hasEstado ? [...new Set(items.map((r) => r.estado).filter(Boolean))].sort() : []),
    [items, hasEstado]
  );
  const filtradoEstado = useMemo(
    () => (estadoFiltro ? filtered.filter((r) => r.estado === estadoFiltro) : filtered),
    [filtered, estadoFiltro]
  );

  const totalPaginas = Math.max(1, Math.ceil(filtradoEstado.length / pageSize));
  const paginaActual = Math.min(pagina, totalPaginas);
  const pagina_ = filtradoEstado.slice((paginaActual - 1) * pageSize, paginaActual * pageSize);

  const imprimir = () => {
    const cols = columns.map((c) => ({
      label: c.label,
      get: c.print || ((row) => (c.render ? c.render(row) : (row[c.key] ?? '-'))),
    }));
    imprimirReporteGenerico(title, cols, filtradoEstado, usuario);
  };

  return (
    <div>
      <PageHeader title={title} description={description} />

      <div className="toolbar" style={{ alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 280px', maxWidth: 380 }}>
          <SearchBar value={term} onChange={(v) => { setTerm(v); setPagina(1); }} placeholder="Buscar..." />
        </div>
        {hasEstado && estadosDisponibles.length > 0 && (
          <select className="form-control" style={{ maxWidth: 160 }} value={estadoFiltro}
            onChange={(e) => { setEstadoFiltro(e.target.value); setPagina(1); }}>
            <option value="">Todos los estados</option>
            {estadosDisponibles.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        )}
        <div className="spacer" />
        <Button variant="secondary" icon="🖨️" onClick={imprimir} disabled={loading || !!error}>Imprimir</Button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-wrapper">
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr>{columns.map((c) => <th key={c.key || c.label}>{c.label}</th>)}</tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 40 }}>Cargando...</td></tr>
              ) : filtradoEstado.length === 0 ? (
                <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                  {items.length === 0 ? 'Sin registros.' : 'Sin resultados para el filtro.'}
                </td></tr>
              ) : pagina_.map((row, i) => (
                <tr key={row.codigo ?? row.correlativo ?? i}>
                  {columns.map((c) => <td key={c.key || c.label}>{c.render ? c.render(row) : (row[c.key] ?? '-')}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && filtradoEstado.length > 0 && (
          <div className="table-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{filtradoEstado.length} registro(s){term || estadoFiltro ? ` (de ${items.length})` : ''}</span>
            {totalPaginas > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={paginaActual === 1}
                  style={paginaBtnStyle}>‹ Anterior</button>
                <span style={{ fontSize: 13, minWidth: 90, textAlign: 'center' }}>Página {paginaActual} de {totalPaginas}</span>
                <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas}
                  style={paginaBtnStyle}>Siguiente ›</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const paginaBtnStyle = {
  padding: '4px 12px', fontSize: 13, borderRadius: 6, border: '1px solid #d1d5db',
  background: '#fff', cursor: 'pointer', color: '#374151',
};

export default ReportPage;
