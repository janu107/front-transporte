/**
 * ReporteTransportistaPage.jsx — REPORTE POR TRANSPORTISTA.
 *
 * Resumen de las pólizas ACTIVAS de un transportista: viajes, peso en quintales,
 * flete, anticipos, diesel, aceite y el saldo que se le debe pagar. Solo entran
 * las transacciones vigentes (los anulados no cuentan).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import SearchableSelect from '../../components/common/SearchableSelect';
import useAuth from '../../hooks/useAuth';
import realApi from '../../api/realApi';
import { formatNumber, formatCurrency } from '../../utils/formatters';
import { imprimirReporteTransportista } from '../../utils/impresionDocs';
import { exportarExcel } from '../../utils/excel';

export default function ReporteTransportistaPage() {
  const { user } = useAuth();
  const [transportistas, setTransportistas] = useState([]);
  const [idT, setIdT] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setTransportistas(await realApi.transportistasReporte());
      } catch (e) {
        setMessage({ type: 'error', text: e?.userMessage || 'No se pudo cargar el catálogo de transportistas.' });
      }
    })();
  }, []);

  const opciones = useMemo(
    () => transportistas.map((t) => ({
      value: t.codigo,
      label: `${t.nit || 's/nit'} — ${t.nombre_comercial}`,
      buscar: [t.nit, t.nombre_comercial].filter(Boolean).join(' '),
    })),
    [transportistas]
  );

  const generar = useCallback(async (id) => {
    if (!id) { setData(null); return; }
    setLoading(true); setMessage(null);
    try {
      setData(await realApi.reporteTransportista({ id_transportista: id }));
    } catch (e) {
      setData(null);
      setMessage({ type: 'error', text: e?.userMessage || e?.response?.data?.message || 'No se pudo generar el reporte.' });
    } finally { setLoading(false); }
  }, []);

  const elegir = (v) => { setIdT(v); generar(v); };

  const usuario = user?.nombre || user?.usuario || '';
  const columnas = [
    { label: 'Póliza', get: (f) => f.nombre_poliza },
    { label: 'Viajes', get: (f) => Number(f.viajes || 0) },
    { label: 'Peso qq', get: (f) => Number(f.peso_qq || 0) },
    { label: 'Flete', get: (f) => Number(f.flete || 0) },
    { label: 'Anticipo', get: (f) => Number(f.anticipo || 0) },
    { label: 'Diesel', get: (f) => Number(f.diesel || 0) },
    { label: 'Aceite', get: (f) => Number(f.aceite || 0) },
    { label: 'Saldo', get: (f) => Number(f.saldo || 0) },
  ];

  const exportar = () => exportarExcel('Reporte por Transportista', columnas, data?.filas || [], {
    meta: [['Usuario', usuario],
      ['Transportista', `${data?.transportista?.nit || ''} — ${data?.transportista?.nombre_comercial || ''}`],
      ['Pólizas', data?.totales?.polizas], ['Saldo', data?.totales?.saldo]],
  });

  const t = data?.totales;

  return (
    <div>
      <PageHeader
        title="Reporte por Transportista"
        description="Resumen de pólizas activas: viajes, peso, flete, descuentos y saldo a pagar."
      />
      {message && <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>}

      <div className="toolbar" style={{ alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 320 }}>
          <SearchableSelect label="Transportista" name="id_transportista" value={idT}
            onChange={elegir} options={opciones} required
            placeholder={opciones.length ? 'Escriba el NIT o el nombre...' : 'Cargando transportistas...'} />
        </div>
        {data && (
          <>
            <Button variant="secondary" icon="📊" onClick={exportar} disabled={!data.filas?.length}>
              Excel
            </Button>
            <Button variant="secondary" icon="🖨️" onClick={() => imprimirReporteTransportista(data, usuario)}>
              Imprimir
            </Button>
          </>
        )}
      </div>

      {loading ? (
        <div className="card"><div className="card-body">Generando reporte...</div></div>
      ) : !data ? (
        <div className="card"><div className="card-body" style={{ color: '#6b7280' }}>
          Elija un transportista para ver el resumen de sus pólizas activas.
        </div></div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-body">
              <h3 style={{ marginTop: 0, fontSize: 14 }}>
                {data.transportista.nit} — {data.transportista.nombre_comercial}
              </h3>
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                {formatNumber(t.polizas, 0)} póliza(s) activa(s) · {formatNumber(t.viajes, 0)} viaje(s) ·{' '}
                <b>Saldo: {formatCurrency(t.saldo)}</b>
              </div>
            </div>
          </div>

          {data.filas.length === 0 ? (
            <div className="card"><div className="card-body" style={{ color: '#6b7280' }}>
              Este transportista no tiene movimientos en pólizas activas.
            </div></div>
          ) : (
            <div className="table-wrapper"><div className="table-scroll">
              <table className="data-table">
                <thead><tr>
                  <th style={{ textAlign: 'right' }}>No.</th>
                  <th>Póliza</th>
                  <th style={{ textAlign: 'right' }}>Viajes</th>
                  <th style={{ textAlign: 'right' }}>Peso qq</th>
                  <th style={{ textAlign: 'right' }}>Flete</th>
                  <th style={{ textAlign: 'right' }}>Anticipo</th>
                  <th style={{ textAlign: 'right' }}>Diesel</th>
                  <th style={{ textAlign: 'right' }}>Aceite</th>
                  <th style={{ textAlign: 'right' }}>Saldo</th>
                </tr></thead>
                <tbody>
                  {data.filas.map((f, i) => (
                    <tr key={f.id_poliza}>
                      <td style={{ textAlign: 'right' }}>{i + 1}</td>
                      <td>{f.nombre_poliza}</td>
                      <td style={{ textAlign: 'right' }}>{formatNumber(f.viajes, 0)}</td>
                      <td style={{ textAlign: 'right' }}>{formatNumber(f.peso_qq)}</td>
                      <td style={{ textAlign: 'right' }}>{formatNumber(f.flete)}</td>
                      <td style={{ textAlign: 'right' }}>{formatNumber(f.anticipo)}</td>
                      <td style={{ textAlign: 'right' }}>{formatNumber(f.diesel)}</td>
                      <td style={{ textAlign: 'right' }}>{formatNumber(f.aceite)}</td>
                      {/* El saldo negativo se resalta: se le adelantó más de lo que generó. */}
                      <td style={{ textAlign: 'right', fontWeight: 700, color: f.saldo < 0 ? '#c1121f' : undefined }}>
                        {formatNumber(f.saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 700 }}>
                    <td style={{ textAlign: 'right' }}>{formatNumber(t.polizas, 0)}</td>
                    <td>Total</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(t.viajes, 0)}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(t.peso_qq)}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(t.flete)}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(t.anticipo)}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(t.diesel)}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(t.aceite)}</td>
                    <td style={{ textAlign: 'right', color: t.saldo < 0 ? '#c1121f' : undefined }}>
                      {formatNumber(t.saldo)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div></div>
          )}
        </>
      )}
    </div>
  );
}
