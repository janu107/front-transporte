/**
 * RetarifarModal.jsx — [2026-08 §2]
 * Modal para "retarifar" una póliza: muestra las tarifas de embarque que han tenido
 * movimiento en la póliza (historial de sus envíos). Se elige una tarifa, se escribe
 * el valor de la NUEVA tarifa y se recalcula el VALOR de todos esos envíos:
 *   valor = peso × (Porcentaje de pagos) × nueva tarifa
 * El resultado se guarda en el campo Valor del detalle de la póliza.
 */
import { useCallback, useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import realApi from '../../api/realApi';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export default function RetarifarModal({ poliza, onClose }) {
  const isOpen = Boolean(poliza);
  const [tarifas, setTarifas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sel, setSel] = useState(null); // id_tarifa_embarque seleccionado
  const [nuevaTarifa, setNuevaTarifa] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const cargar = useCallback(async (idPoliza) => {
    setLoading(true); setError(null); setResult(null);
    setSel(null); setNuevaTarifa('');
    try {
      setTarifas(await realApi.viajesTarifasPoliza(idPoliza));
    } catch (e) {
      setTarifas([]);
      setError(e?.userMessage || e?.response?.data?.message || 'No se pudieron cargar las tarifas de la póliza.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (poliza) cargar(poliza.codigo);
  }, [poliza, cargar]);

  const seleccionada = tarifas.find((t) => String(t.id_tarifa_embarque) === String(sel)) || null;
  const nueva = Number(nuevaTarifa);
  const puedeAplicar = seleccionada && nuevaTarifa !== '' && Number.isFinite(nueva) && nueva >= 0 && !saving;

  const aplicar = async () => {
    if (!puedeAplicar) return;
    setSaving(true); setError(null);
    try {
      const r = await realApi.viajesRetarifar(poliza.codigo, {
        id_tarifa_embarque: sel,
        nueva_tarifa: nueva,
      });
      setResult(r);
      // Refresca los conteos/valores de la tabla tras el recálculo.
      await cargar(poliza.codigo);
    } catch (e) {
      setError(e?.userMessage || e?.response?.data?.message || 'No se pudo aplicar la nueva tarifa.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={poliza ? `Retarifar — ${poliza.nombre_poliza}` : 'Retarifar'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cerrar</Button>
          <Button variant="primary" icon="🏷️" onClick={aplicar} disabled={!puedeAplicar}>
            {saving ? 'Aplicando...'
              : seleccionada ? `Aplicar a ${formatNumber(seleccionada.num_envios, 0)} envío(s)` : 'Aplicar'}
          </Button>
        </>
      }
    >
      {error && <div className="alert alert-error" style={{ marginTop: 0 }}>{error}</div>}
      {result && (
        <div className="alert alert-success" style={{ marginTop: 0 }}>
          ✅ Se actualizaron <b>{formatNumber(result.actualizados, 0)}</b> envío(s).
          Nuevo total de esos envíos: <b>{formatCurrency(result.total_valor)}</b>.
        </div>
      )}

      <p style={{ fontSize: 13, color: '#374151', margin: '4px 0 10px' }}>
        Seleccione la tarifa a corregir, escriba el valor de la nueva tarifa y presione
        «Aplicar». El valor de cada envío se recalcula como
        <b> peso × porcentaje de pagos × nueva tarifa</b> y se guarda en el detalle de la póliza.
      </p>

      <div className="table-wrapper">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Tarifa</th>
                <th>Origen → Destino</th>
                <th style={{ textAlign: 'right' }}>Valor actual</th>
                <th style={{ textAlign: 'right' }}>Envíos</th>
                <th style={{ textAlign: 'right' }}>Peso total</th>
                <th style={{ textAlign: 'right' }}>Valor acumulado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30 }}>Cargando...</td></tr>
              ) : tarifas.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#6b7280' }}>
                  Esta póliza no tiene envíos con tarifa registrada.
                </td></tr>
              ) : tarifas.map((t) => {
                const selRow = String(t.id_tarifa_embarque) === String(sel);
                return (
                  <tr
                    key={t.id_tarifa_embarque}
                    onClick={() => setSel(t.id_tarifa_embarque)}
                    style={{ cursor: 'pointer', background: selRow ? 'rgba(193,18,31,0.10)' : undefined }}
                  >
                    <td style={{ textAlign: 'center' }}>
                      <input type="radio" name="tarifaSel" checked={selRow} onChange={() => setSel(t.id_tarifa_embarque)} />
                    </td>
                    <td>{t.id_tarifa_embarque}</td>
                    <td>{`${t.origen || '—'} → ${t.destino || '—'}`}</td>
                    <td style={{ textAlign: 'right' }}>{t.valor_tarifa != null ? `Q${formatNumber(t.valor_tarifa, 5)}` : '—'}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(t.num_envios, 0)}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(t.suma_peso)}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(t.suma_valor)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="form-grid" style={{ marginTop: 14, alignItems: 'flex-end' }}>
        <Input
          label="Valor de la nueva tarifa"
          name="nuevaTarifa"
          type="number"
          min={0}
          step="0.00001"
          value={nuevaTarifa}
          onChange={(e) => setNuevaTarifa(e.target.value)}
          placeholder="Ej. 0.85"
        />
        {seleccionada && nuevaTarifa !== '' && Number.isFinite(nueva) && (
          <div className="form-field">
            <label className="form-label">Vista previa</label>
            <div style={{ fontSize: 13, color: '#374151', paddingTop: 8 }}>
              Se recalcularán <b>{formatNumber(seleccionada.num_envios, 0)}</b> envío(s) con la
              tarifa <b>{seleccionada.id_tarifa_embarque}</b>.
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
