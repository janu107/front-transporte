/**
 * HistorialPage.jsx — [v6 §3] HISTORIAL.
 * Tres vistas sobre las tablas históricas del sistema:
 *   - Detalle de Póliza   (his_det_poliza)
 *   - Detalle de Vales    (his_val_detalle)
 *   - Detalle de Anticipos (his_anticipo_efectivo)
 * La tabla se arma DINÁMICAMENTE con las columnas que devuelve el backend (que las
 * lee del esquema real), así funciona aunque la estructura varíe. Filtros: rango de
 * fechas (sobre la columna de fecha detectada) y búsqueda de texto.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import realApi from '../../api/realApi';
import useAuth from '../../hooks/useAuth';
import { formatDate } from '../../utils/formatters';
import { imprimirReporteGenerico } from '../../utils/impresionDocs';

const TABS = [
  { tipo: 'det-poliza', label: 'Detalle de Póliza' },
  { tipo: 'val-detalle', label: 'Detalle de Vales' },
  { tipo: 'anticipo-efectivo', label: 'Detalle de Anticipos' },
];

const LIMIT = 25; // [2026-08 §3] Paginación de 25 en 25 (del más nuevo al más antiguo).

// snake_case / minúsculas -> "Título Legible"
const prettify = (s) => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Formatea el valor de una celda: fechas legibles, resto tal cual.
const cellText = (value, col, dateCol) => {
  if (value === null || value === undefined) return '';
  if (col === dateCol || /fecha/i.test(col)) {
    const s = String(value);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return formatDate(s);
  }
  return String(value);
};

export default function HistorialPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState(TABS[0].tipo);
  const [f, setF] = useState({ fecha_inicio: '', fecha_fin: '', q: '' });
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const setField = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const cargar = useCallback(async (tipo, filtros, pg) => {
    setLoading(true);
    setMessage(null);
    try {
      const params = { page: pg, limit: LIMIT };
      if (filtros.fecha_inicio) params.fecha_inicio = filtros.fecha_inicio;
      if (filtros.fecha_fin) params.fecha_fin = filtros.fecha_fin;
      if (filtros.q) params.q = filtros.q;
      setData(await realApi.historial(tipo, params));
    } catch (e) {
      setData(null);
      setMessage({ type: 'error', text: e?.userMessage || e?.response?.data?.message || 'No se pudo cargar el historial.' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial y al cambiar de pestaña.
  useEffect(() => { setPage(1); cargar(tab, f, 1); /* eslint-disable-next-line */ }, [tab]);

  const buscar = () => { setPage(1); cargar(tab, f, 1); };
  const irPagina = (pg) => { setPage(pg); cargar(tab, f, pg); };

  const columnas = data?.columnas || [];
  const filas = data?.rows || [];
  const dateCol = data?.date_column;
  const totalPaginas = data ? Math.max(1, Math.ceil((data.total || 0) / (data.limit || LIMIT))) : 1;
  const tabLabel = useMemo(() => TABS.find((t) => t.tipo === tab)?.label || 'Historial', [tab]);

  const imprimir = () => {
    if (!filas.length) return;
    const cols = columnas.map((c) => ({ label: prettify(c), get: (row) => cellText(row[c], c, dateCol) }));
    imprimirReporteGenerico(`Historial — ${tabLabel}`, cols, filas, user?.nombre || user?.usuario || '');
  };

  return (
    <div>
      <PageHeader title="Historial" description="Consulta de información histórica del sistema (solo lectura)." />

      {/* Pestañas */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e5e7eb', marginBottom: 12, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.tipo}
            onClick={() => setTab(t.tipo)}
            style={{
              border: 'none', background: 'none', cursor: 'pointer', padding: '8px 14px', fontSize: 13,
              fontWeight: tab === t.tipo ? 700 : 400,
              color: tab === t.tipo ? '#c1121f' : '#6b7280',
              borderBottom: tab === t.tipo ? '3px solid #c1121f' : '3px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {message && <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>}

      {/* Filtros */}
      <div className="toolbar" style={{ alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <Input label="Desde" name="fecha_inicio" type="date" value={f.fecha_inicio} onChange={(e) => setField('fecha_inicio', e.target.value)} />
        <Input label="Hasta" name="fecha_fin" type="date" value={f.fecha_fin} onChange={(e) => setField('fecha_fin', e.target.value)} />
        <div style={{ minWidth: 220 }}>
          <Input label="Búsqueda" name="q" value={f.q} placeholder="Texto a buscar..."
            onChange={(e) => setField('q', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') buscar(); }} />
        </div>
        <Button variant="primary" icon="🔍" onClick={buscar} disabled={loading}>{loading ? 'Buscando...' : 'Buscar'}</Button>
        {filas.length > 0 && <Button variant="secondary" icon="🖨️" onClick={imprimir}>Imprimir</Button>}
      </div>

      {dateCol && (
        <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 8px' }}>
          El filtro de fechas se aplica sobre la columna <b>{prettify(dateCol)}</b>.
        </p>
      )}

      {/* Tabla dinámica */}
      {loading ? (
        <div className="card"><div className="card-body">Cargando...</div></div>
      ) : !data ? (
        <div className="card"><div className="card-body" style={{ color: '#6b7280' }}>Configure los filtros y presione «Buscar».</div></div>
      ) : filas.length === 0 ? (
        <div className="card"><div className="card-body" style={{ color: '#6b7280' }}>No hay registros para el filtro seleccionado.</div></div>
      ) : (
        <>
          <div className="table-wrapper">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>{columnas.map((c) => <th key={c}>{prettify(c)}</th>)}</tr>
                </thead>
                <tbody>
                  {filas.map((row, i) => (
                    <tr key={i}>
                      {columnas.map((c) => <td key={c}>{cellText(row[c], c, dateCol)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 13, color: '#374151' }}>
            <span>{data.total} registro(s) · página {page} de {totalPaginas}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={() => irPagina(page - 1)} disabled={page <= 1 || loading}>« Anterior</Button>
              <Button variant="secondary" onClick={() => irPagina(page + 1)} disabled={page >= totalPaginas || loading}>Siguiente »</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
