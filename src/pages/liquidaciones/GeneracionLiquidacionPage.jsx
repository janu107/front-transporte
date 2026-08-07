/**
 * GeneracionLiquidacionPage.jsx
 * Panel de generación de liquidaciones: a la izquierda los parámetros (póliza y
 * tratamiento del sobregiro anterior) y a la derecha las tarjetas de los
 * transportistas con su desglose expandible.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LiquidacionTabs from '../../components/liquidaciones/LiquidacionTabs';
import realApi from '../../api/realApi';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export default function GeneracionLiquidacionPage() {
  const [polizas, setPolizas] = useState([]);
  const [idPoliza, setIdPoliza] = useState('');
  const [aplicaSobregiro, setAplicaSobregiro] = useState(true);
  const [vista, setVista] = useState(null);
  const [cargandoPolizas, setCargandoPolizas] = useState(true);
  const [calculando, setCalculando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [expandido, setExpandido] = useState(null);
  const [message, setMessage] = useState(null);

  const cargarPolizas = useCallback(async () => {
    try { setPolizas(await realApi.liquidacionV2Polizas()); }
    catch (e) { setMessage({ type: 'error', text: e?.userMessage || 'No se pudieron cargar las pólizas disponibles.' }); }
  }, []);

  useEffect(() => { cargarPolizas().finally(() => setCargandoPolizas(false)); }, [cargarPolizas]);

  const options = useMemo(() => polizas.map((p) => ({
    value: p.codigo,
    label: `${p.codigo} — ${p.nombre_poliza}${p.id_liq_origen ? ' · reliquidación' : ''}`,
  })), [polizas]);
  const seleccionada = polizas.find((p) => String(p.codigo) === String(idPoliza));

  // La vista previa se calcula al elegir la póliza (sin botón aparte).
  const elegirPoliza = async (value) => {
    setIdPoliza(value); setVista(null); setMessage(null); setExpandido(null);
    if (!value) return;
    setCalculando(true);
    try { setVista(await realApi.liquidacionV2VistaPrevia(value)); }
    catch (e) { setMessage({ type: 'error', text: e?.userMessage || 'No se pudo calcular la vista previa.' }); }
    finally { setCalculando(false); }
  };

  const generar = async () => {
    setConfirmOpen(false); setGenerando(true); setMessage(null);
    try {
      const data = await realApi.liquidacionV2Generar({
        id_poliza: Number(idPoliza),
        id_liq_origen: seleccionada?.id_liq_origen || null,
        aplica_sobregiro: aplicaSobregiro,
      });
      setMessage({
        type: 'success',
        text: `Liquidación ${data.liquidacion?.num_liquidacion || ''} generada correctamente.`,
      });
      setIdPoliza(''); setVista(null); setExpandido(null);
      await cargarPolizas();
    } catch (e) {
      setMessage({ type: 'error', text: e?.userMessage || 'No se pudo generar la liquidación.' });
    } finally { setGenerando(false); }
  };

  const filas = vista?.transportistas || [];
  const sobregiroPendiente = filas.reduce((s, r) => s + Number(r.sobregiro_anterior || 0), 0);

  // Si el sobregiro NO se aplica ahora, se devuelve al líquido del transportista
  // (valor_liquidacion ya viene con el sobregiro descontado desde el servidor).
  const liquidoDe = (row) => Number(row.valor_liquidacion || 0)
    + (aplicaSobregiro ? 0 : Number(row.sobregiro_anterior || 0));
  const total = filas.reduce((s, r) => s + liquidoDe(r), 0);

  return (
    <div>
      <PageHeader title="Generación de liquidación"
        description="Calcula y registra la liquidación de todos los transportistas de una póliza disponible." />
      <LiquidacionTabs />

      {message && <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>}

      <div className="liq-generar">
        {/* ---------------- Parámetros ---------------- */}
        <aside className="card liq-panel">
          <div className="card-body">
            <h3 className="liq-panel-title">📁 Parámetros</h3>

            <Select label="Póliza a liquidar" name="idPolizaLiquidacion"
              value={idPoliza} options={options}
              onChange={(e) => elegirPoliza(e.target.value)}
              placeholder={cargandoPolizas ? 'Cargando pólizas...'
                : (options.length ? 'Seleccione una póliza...' : 'No hay pólizas disponibles')} />

            <div className="form-field">
              <span className="form-label" id="lblSobregiro">¿Aplicar sobregiro anterior?</span>
              <div className="liq-toggle" role="group" aria-labelledby="lblSobregiro">
                <button type="button"
                  className={`liq-toggle-btn ${aplicaSobregiro ? 'active' : ''}`}
                  aria-pressed={aplicaSobregiro}
                  onClick={() => setAplicaSobregiro(true)}>
                  ✅ Sí, aplicar
                </button>
                <button type="button"
                  className={`liq-toggle-btn ${!aplicaSobregiro ? 'active' : ''}`}
                  aria-pressed={!aplicaSobregiro}
                  onClick={() => setAplicaSobregiro(false)}>
                  ⏭️ Siguiente póliza
                </button>
              </div>
            </div>

            {sobregiroPendiente > 0 && (
              <div className="liq-aviso">
                ⚠️ Sobregiro pendiente: <b>{formatCurrency(sobregiroPendiente)}</b>
                <div className="liq-aviso-nota">
                  {aplicaSobregiro
                    ? 'Se descontará en esta liquidación.'
                    : 'No se descuenta ahora; queda pendiente para la siguiente póliza.'}
                </div>
              </div>
            )}

            <Button variant="primary" icon="⚡" block onClick={() => setConfirmOpen(true)}
              disabled={!filas.length || generando || calculando}>
              {generando ? 'Generando...' : 'Generar Liquidación'}
            </Button>
          </div>
        </aside>

        {/* ---------------- Transportistas ---------------- */}
        <section className="card liq-panel">
          <div className="card-body">
            <div className="liq-panel-head">
              <h3 className="liq-panel-title">🚛 Transportistas</h3>
              {filas.length > 0 && (
                <span className="liq-conteo">
                  {filas.length} {filas.length === 1 ? 'transportista' : 'transportistas'}
                </span>
              )}
            </div>

            {calculando ? (
              <p className="liq-vacio">Calculando vista previa...</p>
            ) : !idPoliza ? (
              <p className="liq-vacio">Seleccione una póliza para revisar los montos.</p>
            ) : filas.length === 0 ? (
              <p className="liq-vacio">Esta póliza no tiene movimientos para liquidar.</p>
            ) : (
              <>
                <ul className="liq-lista">
                  {filas.map((row) => {
                    const key = row.id_transportista;
                    const abierto = String(expandido) === String(key);
                    const liquido = liquidoDe(row);
                    const sobregiro = Number(row.sobregiro_anterior || 0);
                    return (
                      <li key={key} className="liq-item">
                        <button type="button" className="liq-item-head"
                          aria-expanded={abierto}
                          onClick={() => setExpandido(abierto ? null : key)}>
                          <span className="liq-item-info">
                            <span className="liq-item-nombre">
                              🚚 {row.nombre || '—'}
                              {aplicaSobregiro && sobregiro > 0 && (
                                <span className="liq-chip-sob">↓ Sob. {formatCurrency(sobregiro)}</span>
                              )}
                            </span>
                            <span className="liq-item-meta">
                              NIT: {row.nit || '—'} | IMP: {formatNumber(row.porcentaje_impuesto, 0)}%
                            </span>
                          </span>
                          <span className={`liq-item-monto ${liquido < 0 ? 'neg' : 'pos'}`}>
                            {formatCurrency(liquido)}
                          </span>
                          <span className={`liq-chevron ${abierto ? 'abierto' : ''}`} aria-hidden="true">▾</span>
                        </button>

                        {abierto && (
                          <div className="liq-item-detalle">
                            <dl className="liq-datos">
                              <Dato etiqueta="Viajes" valor={`${formatNumber(row.cantidad_viajes, 0)} · ${formatCurrency(row.valor_viajes)}`} />
                              <Dato etiqueta="Diesel" valor={formatCurrency(row.valor_diesel)} />
                              <Dato etiqueta="Galones" valor={formatNumber(row.total_galones)} />
                              <Dato etiqueta="Anticipos" valor={formatCurrency(row.valor_anticipos)} />
                              <Dato etiqueta="Base gravable" valor={formatCurrency(row.base_gravable)} />
                              <Dato etiqueta="Impuesto" valor={formatCurrency(row.valor_impuesto)} />
                              <Dato etiqueta="Total a facturar" valor={formatCurrency(row.total_facturar)} />
                              <Dato etiqueta="Suministro" valor={formatCurrency(row.suministro)} />
                              <Dato etiqueta="Sobregiro anterior"
                                valor={aplicaSobregiro ? formatCurrency(sobregiro) : `${formatCurrency(sobregiro)} (no se aplica)`} />
                            </dl>

                            {(row.vales || []).length > 0 && (
                              <div className="liq-vales">
                                <div className="liq-vales-tit">Vales de diesel incluidos</div>
                                <div className="table-scroll">
                                  <table className="data-table">
                                    <thead><tr>
                                      <th>N° vale</th><th>Factura</th><th>Fecha</th>
                                      <th style={{ textAlign: 'right' }}>Galones</th>
                                      <th style={{ textAlign: 'right' }}>Total</th>
                                    </tr></thead>
                                    <tbody>{row.vales.map((v) => (
                                      <tr key={v.correlativo}>
                                        <td>{v.num_vale || '—'}</td>
                                        <td>{v.factura || '—'}</td>
                                        <td>{String(v.fecha || '').slice(0, 10)}</td>
                                        <td style={{ textAlign: 'right' }}>{formatNumber(v.galones)}</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(v.total)}</td>
                                      </tr>
                                    ))}</tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>

                <div className="liq-total">
                  <span>Total a pagar de la liquidación</span>
                  <b className={total < 0 ? 'neg' : 'pos'}>{formatCurrency(total)}</b>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={generar}
        title="Generar liquidación" confirmText="Generar liquidación"
        message={`¿Confirma los montos mostrados? Se aplicarán los vales y anticipos incluidos y la póliza quedará LIQUIDADA. ${
          aplicaSobregiro
            ? 'El sobregiro anterior SE DESCONTARÁ en esta liquidación.'
            : 'El sobregiro anterior NO se descuenta ahora: quedará pendiente para la siguiente póliza.'
        }`} />
    </div>
  );
}

function Dato({ etiqueta, valor }) {
  return (
    <>
      <dt>{etiqueta}</dt>
      <dd>{valor}</dd>
    </>
  );
}
