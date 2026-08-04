/**
 * ReporteAnticiposPolizaPage.jsx — [2026-08 §11]
 * REPORTE DE ANTICIPOS A TRANSPORTISTAS por póliza o arrastre (todas).
 * Agrupado por transportista con subtotal y total por póliza / general.
 */
import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import SearchableSelect from '../../components/common/SearchableSelect';
import realApi from '../../api/realApi';
import useAuth from '../../hooks/useAuth';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { imprimirReporteAnticiposPoliza } from '../../utils/impresionDocs';

const MODO_OPTIONS = [
  { value: 'POLIZA', label: 'Por póliza' },
  { value: 'ARRASTRE', label: 'Arrastre (todas)' },
];

export default function ReporteAnticiposPolizaPage() {
  const { user } = useAuth();
  const [f, setF] = useState({ modo: 'POLIZA', id_poliza: '' });
  const [polizas, setPolizas] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    (async () => { setPolizas(await realApi.list('polizas').catch(() => [])); })();
  }, []);

  const setField = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const polizaOptions = useMemo(() => polizas.map((p) => ({ value: p.codigo, label: p.nombre_poliza })), [polizas]);

  const generar = async () => {
    setMessage(null);
    if (f.modo === 'POLIZA' && !f.id_poliza) { setMessage({ type: 'error', text: 'Seleccione una póliza.' }); return; }
    setLoading(true);
    try {
      const params = { modo: f.modo };
      if (f.modo === 'POLIZA') params.id_poliza = f.id_poliza;
      setData(await realApi.reporteAnticiposPoliza(params));
    } catch (e) {
      setData(null);
      setMessage({ type: 'error', text: e?.userMessage || e?.response?.data?.message || 'No se pudo generar el reporte.' });
    } finally { setLoading(false); }
  };

  const arrastre = data && String(data.modo).toUpperCase() === 'ARRASTRE';

  return (
    <div>
      <PageHeader title="Anticipos a Transportistas" description="Anticipos agrupados por transportista, por póliza o arrastre (todas)." />
      {message && <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>}

      {/* Filtros */}
      <div className="toolbar" style={{ alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 180 }}>
          <Select label="Modo" name="modo" value={f.modo}
            onChange={(e) => { setField('modo', e.target.value); if (e.target.value === 'ARRASTRE') setField('id_poliza', ''); }}
            options={MODO_OPTIONS} />
        </div>
        {f.modo === 'POLIZA' && (
          <div style={{ minWidth: 260 }}>
            <SearchableSelect label="Póliza" name="id_poliza" value={f.id_poliza}
              onChange={(v) => setField('id_poliza', v)} options={polizaOptions} placeholder="Escriba para buscar póliza..." />
          </div>
        )}
        <Button variant="primary" icon="🔍" onClick={generar} disabled={loading}>{loading ? 'Generando...' : 'Generar'}</Button>
        {data && data.grupos.length > 0 && (
          <Button variant="secondary" icon="🖨️" onClick={() => imprimirReporteAnticiposPoliza(data, user?.nombre || user?.usuario || '')}>Imprimir</Button>
        )}
      </div>

      {loading ? (
        <div className="card"><div className="card-body">Generando reporte...</div></div>
      ) : !data ? (
        <div className="card"><div className="card-body" style={{ color: '#6b7280' }}>Configure los filtros y presione «Generar».</div></div>
      ) : data.grupos.length === 0 ? (
        <div className="card"><div className="card-body" style={{ color: '#6b7280' }}>No hay anticipos para el filtro seleccionado.</div></div>
      ) : (
        <>
          {data.poliza && <h3 style={{ fontSize: 14, color: '#1f3d5c', margin: '4px 0 10px' }}>Póliza: {data.poliza.nombre_poliza}</h3>}
          {data.grupos.map((g) => (
            <div className="table-wrapper" key={g.id_transportista} style={{ marginBottom: 14 }}>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr style={{ background: '#6b7a8c' }}>
                      <th colSpan={arrastre ? 7 : 6} style={{ color: '#fff' }}>TRANSPORTISTA: {g.transportista}</th>
                    </tr>
                    <tr>
                      <th>Vale</th><th>Placa</th><th>Fecha</th><th>Piloto</th>
                      {arrastre && <th>Póliza</th>}
                      <th style={{ textAlign: 'right' }}>Anticipo</th><th>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.anticipos.map((a, i) => (
                      <tr key={`${a.num_anticipo}-${i}`}>
                        <td>{a.num_anticipo}</td>
                        <td>{a.placa}</td>
                        <td>{formatDate(a.fecha)}</td>
                        <td>{a.piloto}</td>
                        {arrastre && <td>{a.poliza}</td>}
                        <td style={{ textAlign: 'right' }}>{formatCurrency(a.valor)}</td>
                        <td>{a.motivo}</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 700, background: '#f3f4f6' }}>
                      <td colSpan={arrastre ? 5 : 4} style={{ textAlign: 'right' }}>Total x Transportista:</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(g.total)}</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <div className="card"><div className="card-body" style={{ textAlign: 'right', fontWeight: 800, color: '#1f3d5c' }}>
            Total {data.poliza ? 'x Póliza' : 'general'}: {formatCurrency(data.total_general)}
          </div></div>
        </>
      )}
    </div>
  );
}
