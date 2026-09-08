/**
 * ReportePolizasTransportistasPage.jsx — RESUMEN DE PÓLIZAS ACTIVAS POR
 * TRANSPORTISTA.
 *
 * Matriz: una fila por transportista y una columna por póliza activa, con el
 * SALDO de cada cruce (flete − anticipos − diesel − aceite), el total de cada
 * transportista y la suma de todas las pólizas. Es el mismo saldo del «Reporte
 * por Transportista», para que los dos reportes cuadren celda por celda.
 * Se imprime en horizontal y, cuando hay más pólizas de las que caben, se
 * reparten en varias hojas (cada una con su propia suma).
 */
import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';
import realApi from '../../api/realApi';
import { formatNumber, formatCurrency } from '../../utils/formatters';
import { imprimirPolizasPorTransportista } from '../../utils/impresionDocs';
import { exportarExcel } from '../../utils/excel';

export default function ReportePolizasTransportistasPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true); setMessage(null);
    try {
      setData(await realApi.reportePolizasTransportistas());
    } catch (e) {
      setData(null);
      setMessage({ type: 'error', text: e?.userMessage || e?.response?.data?.message || 'No se pudo generar el reporte.' });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const usuario = user?.nombre || user?.usuario || '';

  // En Excel cada póliza es una columna, igual que en pantalla.
  const exportar = () => exportarExcel('Saldos por Transportista y Póliza', [
    { label: 'NIT', get: (f) => f.nit },
    { label: 'Nombre', get: (f) => f.nombre },
    ...(data?.polizas || []).map((p) => ({
      label: p.nombre_poliza,
      get: (f) => Number(f.valores?.[p.codigo] || 0),
    })),
    { label: 'TOTAL', get: (f) => Number(f.total || 0) },
  ], data?.filas || [], {
    meta: [['Usuario', usuario],
      ['Pólizas activas', (data?.polizas || []).length],
      ['Cálculo de cada celda', 'Flete − anticipos − diesel − aceite'],
      ['Saldo general', data?.total_general]],
  });

  return (
    <div>
      <PageHeader
        title="Pólizas Activas por Transportista"
        description="Saldo a pagar de cada transportista en cada póliza abierta: flete menos anticipos, diesel y aceite."
      />
      {message && <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>}

      <div className="toolbar" style={{ alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Button variant="primary" icon="🔄" onClick={cargar} disabled={loading}>
          {loading ? 'Generando...' : 'Actualizar'}
        </Button>
        {data && (
          <>
            <Button variant="secondary" icon="📊" onClick={exportar} disabled={!data.filas?.length}>
              Excel
            </Button>
            <Button variant="secondary" icon="🖨️"
              onClick={() => imprimirPolizasPorTransportista(data, usuario)}
              disabled={!data.filas?.length}>
              Imprimir
            </Button>
          </>
        )}
        {data && (
          <div style={{ marginLeft: 'auto', fontSize: 13, color: '#6b7280' }}>
            {formatNumber((data.polizas || []).length, 0)} póliza(s) ·{' '}
            {formatNumber((data.filas || []).length, 0)} transportista(s) ·{' '}
            <b>Saldo total: {formatCurrency(data.total_general)}</b>
          </div>
        )}
      </div>

      {loading ? (
        <div className="card"><div className="card-body">Generando reporte...</div></div>
      ) : !data || !data.filas.length ? (
        <div className="card"><div className="card-body" style={{ color: '#6b7280' }}>
          No hay movimientos en pólizas abiertas.
        </div></div>
      ) : (
        // La tabla puede ser muy ancha: se desplaza dentro de su propia caja y la
        // página nunca se corre de lado.
        <div className="table-wrapper"><div className="table-scroll" style={{ maxHeight: '70vh' }}>
          <table className="data-table">
            <thead><tr>
              <th>NIT</th>
              <th>Nombre</th>
              {data.polizas.map((p) => (
                <th key={p.codigo} style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{p.nombre_poliza}</th>
              ))}
              <th style={{ textAlign: 'right' }}>TOTAL</th>
            </tr></thead>
            <tbody>
              {data.filas.map((f) => (
                <tr key={f.id_transportista ?? 'sin'}>
                  <td style={{ whiteSpace: 'nowrap' }}>{f.nit || '—'}</td>
                  <td>{f.nombre}</td>
                  {data.polizas.map((p) => {
                    const v = f.valores?.[p.codigo];
                    const d = f.detalles?.[p.codigo];
                    // Sin cruce no hay celda; con cruce se muestra aunque el
                    // saldo dé cero, porque sí hubo movimiento.
                    if (d === undefined && !v) {
                      return (
                        <td key={p.codigo} style={{ textAlign: 'right' }}>
                          <span style={{ color: '#d1d5db' }}>—</span>
                        </td>
                      );
                    }
                    // El title lleva el desglose, para no tener que abrir el
                    // otro reporte solo para ver de dónde sale el saldo.
                    return (
                      <td key={p.codigo} style={{ textAlign: 'right' }}
                        title={d ? `Flete ${formatNumber(d.flete)}`
                          + ` − anticipo ${formatNumber(d.anticipo)}`
                          + ` − diesel ${formatNumber(d.diesel)}`
                          + ` − aceite ${formatNumber(d.aceite)}`
                          + ` = ${formatNumber(v || 0)}  (${formatNumber(d.viajes, 0)} viaje(s))` : undefined}>
                        {/* Saldo negativo: se le adelantó más de lo que generó. */}
                        <span style={{ color: (v || 0) < 0 ? '#c1121f' : undefined }}>
                          {formatNumber(v || 0)}
                        </span>
                      </td>
                    );
                  })}
                  <td style={{ textAlign: 'right', fontWeight: 700, color: f.total < 0 ? '#c1121f' : undefined }}>
                    {formatNumber(f.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 700 }}>
                <td />
                <td>Saldo por póliza</td>
                {data.polizas.map((p) => {
                  const t = Number(data.totales_por_poliza?.[p.codigo] || 0);
                  return (
                    <td key={p.codigo} style={{ textAlign: 'right', color: t < 0 ? '#c1121f' : undefined }}>
                      {formatNumber(t)}
                    </td>
                  );
                })}
                <td style={{ textAlign: 'right' }}>{formatNumber(data.total_general)}</td>
              </tr>
            </tfoot>
          </table>
        </div></div>
      )}
    </div>
  );
}
