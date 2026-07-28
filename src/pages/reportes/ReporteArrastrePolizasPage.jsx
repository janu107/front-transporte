/**
 * ReporteArrastrePolizasPage.jsx — [v5 §6] ARRASTRE DE PESOS/BULTOS POR
 * PÓLIZAS Y PUNTOS DE EMBARQUE.
 * Filtros: póliza (buscable, obligatoria), punto de embarque (buscable,
 * opcional; cat_tarifa_embarque), fechas obligatorias con validación de rango.
 * Resumen de póliza (piezas/peso arrastrado y saldo) + detalle agrupado por
 * punto de embarque. Cálculos resueltos en el backend (reporteArrastre.service.js).
 */
import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import SearchableSelect from '../../components/common/SearchableSelect';
import realApi from '../../api/realApi';
import useAuth from '../../hooks/useAuth';
import { formatNumber, formatDate } from '../../utils/formatters';
import { imprimirReporteArrastre } from '../../utils/impresionDocs';

export default function ReporteArrastrePolizasPage() {
  const { user } = useAuth();
  const [polizas, setPolizas] = useState([]);
  const [puntos, setPuntos] = useState([]);
  const [f, setF] = useState({ poliza_id: '', punto_embarque_id: '', fecha_inicio: '', fecha_fin: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    (async () => {
      const [po, pe] = await Promise.all([
        realApi.list('polizas').catch(() => []),
        realApi.list('tarifaEmbarque').catch(() => []),
      ]);
      setPolizas(po); setPuntos(pe);
    })();
  }, []);

  const setField = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const polizaOptions = useMemo(
    () => polizas.map((p) => ({ value: p.codigo, label: `${p.nombre_poliza} (${p.estado})` })),
    [polizas]
  );
  const puntoOptions = useMemo(
    () => puntos.map((p) => ({ value: p.codigo, label: `${p.descripcion} (${p.origen || '—'} → ${p.destino || '—'})` })),
    [puntos]
  );

  const generar = async () => {
    setMessage(null);
    if (!f.poliza_id) { setMessage({ type: 'error', text: 'Debe seleccionar una póliza.' }); return; }
    if (!f.fecha_inicio || !f.fecha_fin) { setMessage({ type: 'error', text: 'Las fechas inicial y final son obligatorias.' }); return; }
    if (f.fecha_inicio > f.fecha_fin) { setMessage({ type: 'error', text: 'La fecha inicial no puede ser posterior a la final.' }); return; }
    setLoading(true);
    try {
      const params = { poliza_id: f.poliza_id, fecha_inicio: f.fecha_inicio, fecha_fin: f.fecha_fin };
      if (f.punto_embarque_id) params.punto_embarque_id = f.punto_embarque_id;
      setData(await realApi.reporteArrastrePolizas(params));
    } catch (e) {
      setData(null);
      setMessage({ type: 'error', text: e?.userMessage || e?.response?.data?.message || 'No se pudo generar el reporte.' });
    } finally { setLoading(false); }
  };

  const r = data?.resumen;

  return (
    <div>
      <PageHeader
        title="Arrastre de Pesos/Bultos por Pólizas y Puntos de Embarque"
        description="Saldo arrastrado de una póliza y detalle de viajes por punto de embarque."
      />
      {message && <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>}

      <div className="toolbar" style={{ alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 240 }}>
          <SearchableSelect label="Póliza" name="poliza_id" value={f.poliza_id}
            onChange={(v) => setField('poliza_id', v)} options={polizaOptions} placeholder="Buscar póliza..." required />
        </div>
        <div style={{ minWidth: 260 }}>
          <SearchableSelect label="Punto de embarque (opcional)" name="punto_embarque_id" value={f.punto_embarque_id}
            onChange={(v) => setField('punto_embarque_id', v)} options={puntoOptions} placeholder="Todos" />
        </div>
        <Input label="Desde" name="fecha_inicio" type="date" value={f.fecha_inicio} onChange={(e) => setField('fecha_inicio', e.target.value)} />
        <Input label="Hasta" name="fecha_fin" type="date" value={f.fecha_fin} onChange={(e) => setField('fecha_fin', e.target.value)} />
        <Button variant="primary" icon="🔍" onClick={generar} disabled={loading}>{loading ? 'Generando...' : 'Generar'}</Button>
        {data && (
          <Button variant="secondary" icon="🖨️" onClick={() => imprimirReporteArrastre(data, f, user?.nombre || user?.usuario || '')}>
            Imprimir
          </Button>
        )}
      </div>

      {loading ? (
        <div className="card"><div className="card-body">Generando reporte...</div></div>
      ) : !data ? (
        <div className="card"><div className="card-body" style={{ color: '#6b7280' }}>
          Seleccione una póliza y un rango de fechas, luego presione «Generar».
        </div></div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-body">
              <h3 style={{ marginTop: 0, fontSize: 14 }}>
                {data.poliza.nombre_poliza} <span style={{ fontWeight: 400, color: '#6b7280' }}>({data.poliza.estado})</span>
                {data.punto_embarque && <> · Punto: {data.punto_embarque.descripcion}</>}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10, fontSize: 13 }}>
                <div>
                  <b>Piezas de la póliza:</b> {formatNumber(r.cantidad_piezas_poliza, 0)}<br />
                  <b>Arrastradas:</b> {formatNumber(r.piezas_arrastradas, 0)}<br />
                  <b>Saldo:</b> {formatNumber(r.saldo_piezas, 0)}
                </div>
                <div>
                  <b>Peso póliza (kg):</b> {formatNumber(r.peso_kilogramos_poliza)}<br />
                  <b>Arrastrado (kg):</b> {formatNumber(r.peso_arrastrado_kg)}<br />
                  <b>Saldo (kg):</b> {formatNumber(r.saldo_peso_kg)}
                </div>
                <div>
                  <b>Arrastrado (qq):</b> {formatNumber(r.peso_arrastrado_qq)}
                </div>
              </div>
            </div>
          </div>

          {data.grupos.length === 0 ? (
            <div className="card"><div className="card-body" style={{ color: '#6b7280' }}>No hay viajes en el rango consultado.</div></div>
          ) : (
            <>
              {data.grupos.map((g) => (
                <div className="table-wrapper" key={g.id_tarifa_embarque || 'sin-punto'} style={{ marginBottom: 14 }}>
                  <div className="table-scroll">
                    <table className="data-table">
                      <thead>
                        <tr style={{ background: '#1f3d5c' }}>
                          <th colSpan={9} style={{ color: '#fff' }}>{g.descripcion}</th>
                        </tr>
                        <tr>
                          <th>C. Porte</th><th>Fecha</th><th>Piloto</th><th>Placa</th>
                          <th style={{ textAlign: 'right' }}>Bultos</th>
                          <th style={{ textAlign: 'right' }}>Saldo bultos</th>
                          <th style={{ textAlign: 'right' }}>Peso qq</th>
                          <th style={{ textAlign: 'right' }}>Peso kg</th>
                          <th style={{ textAlign: 'right' }}>Saldo kg</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.filas.map((fila) => (
                          <tr key={fila.correlativo}>
                            <td>{fila.num_envio}</td>
                            <td>{formatDate(fila.fecha)}</td>
                            <td>{fila.piloto}</td>
                            <td>{fila.placa}</td>
                            <td style={{ textAlign: 'right' }}>{fila.piezas}</td>
                            <td style={{ textAlign: 'right' }}>{formatNumber(fila.saldo_bultos, 0)}</td>
                            <td style={{ textAlign: 'right' }}>{formatNumber(fila.peso_qq)}</td>
                            <td style={{ textAlign: 'right' }}>{formatNumber(fila.peso_kg)}</td>
                            <td style={{ textAlign: 'right' }}>{formatNumber(fila.saldo_kg)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ fontWeight: 700 }}>
                          <td colSpan={4}>Total del punto</td>
                          <td style={{ textAlign: 'right' }}>{g.total_piezas}</td>
                          <td></td>
                          <td style={{ textAlign: 'right' }}>{formatNumber(g.total_peso_qq)}</td>
                          <td style={{ textAlign: 'right' }}>{formatNumber(g.total_peso_kg)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))}
              <div className="card"><div className="card-body" style={{ display: 'flex', gap: 24, fontWeight: 700 }}>
                <span>Piezas: {data.totales.total_piezas}</span>
                <span>Peso: {formatNumber(data.totales.total_peso_qq)} qq</span>
                <span>Peso: {formatNumber(data.totales.total_peso_kg)} kg</span>
              </div></div>
            </>
          )}
        </>
      )}
    </div>
  );
}
