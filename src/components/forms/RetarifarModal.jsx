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
import Select from '../common/Select';
import realApi from '../../api/realApi';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export default function RetarifarModal({ poliza, onClose }) {
  const isOpen = Boolean(poliza);
  const [tarifas, setTarifas] = useState([]);
  const [transportistas, setTransportistas] = useState([]);
  const [idTransportista, setIdTransportista] = useState(''); // vacío = todos
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [consultado, setConsultado] = useState(false);
  const [sel, setSel] = useState(null); // id_tarifa_embarque seleccionado
  const [nuevaTarifa, setNuevaTarifa] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const cargar = useCallback(async (idPoliza, inicio, fin, transportista) => {
    setLoading(true); setError(null); setResult(null);
    setSel(null); setNuevaTarifa('');
    try {
      const params = { fecha_inicio: inicio, fecha_fin: fin };
      // [V9 §4] Vacío = todos los transportistas.
      if (transportista) params.id_transportista = transportista;
      const [tar, transp] = await Promise.all([
        realApi.viajesTarifasPoliza(idPoliza, params),
        realApi.viajesTransportistasPoliza(idPoliza, { fecha_inicio: inicio, fecha_fin: fin }).catch(() => []),
      ]);
      setTarifas(tar);
      setTransportistas(transp);
      setConsultado(true);
    } catch (e) {
      setTarifas([]);
      setConsultado(false);
      setError(e?.userMessage || e?.response?.data?.message || 'No se pudieron cargar las tarifas de la póliza.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!poliza) return;
    const inicio = String(poliza.fecha || '').slice(0, 10);
    const ahora = new Date();
    const hoy = new Date(ahora.getTime() - (ahora.getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
    setFechaInicio(inicio);
    setFechaFin(inicio && inicio > hoy ? inicio : hoy);
    setTarifas([]); setTransportistas([]); setIdTransportista('');
    setConsultado(false); setSel(null); setNuevaTarifa('');
    setResult(null); setError(null);
  }, [poliza]);

  const seleccionada = tarifas.find((t) => String(t.id_tarifa_embarque) === String(sel)) || null;
  const nueva = Number(nuevaTarifa);
  const rangoValido = fechaInicio && fechaFin && fechaInicio <= fechaFin;
  const puedeAplicar = consultado && rangoValido && seleccionada && nuevaTarifa !== ''
    && Number.isFinite(nueva) && nueva >= 0 && !saving;

  const cambiarFecha = (setter) => (e) => {
    setter(e.target.value);
    setTarifas([]); setConsultado(false); setSel(null); setResult(null); setError(null);
  };

  const cambiarTransportista = (e) => {
    setIdTransportista(e.target.value);
    setTarifas([]); setConsultado(false); setSel(null); setResult(null); setError(null);
  };

  const consultar = () => {
    if (!rangoValido) {
      setError(fechaInicio && fechaFin
        ? 'La fecha de inicio no puede ser posterior a la fecha final.'
        : 'Indique la fecha de inicio y la fecha final.');
      return;
    }
    cargar(poliza.codigo, fechaInicio, fechaFin, idTransportista);
  };

  const aplicar = async () => {
    if (!puedeAplicar) return;
    setSaving(true); setError(null);
    try {
      const r = await realApi.viajesRetarifar(poliza.codigo, {
        id_tarifa_embarque: sel,
        nueva_tarifa: nueva,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        id_transportista: idTransportista || null,
      });
      const params = { fecha_inicio: fechaInicio, fecha_fin: fechaFin };
      if (idTransportista) params.id_transportista = idTransportista;
      const actualizadas = await realApi.viajesTarifasPoliza(poliza.codigo, params);
      setTarifas(actualizadas);
      setSel(null); setNuevaTarifa(''); setResult(r);
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
        Indique el rango de fechas, consulte las tarifas, seleccione la que desea corregir,
        escriba el valor nuevo y presione
        «Aplicar». El valor de cada envío se recalcula como
        <b> peso × porcentaje de pagos × nueva tarifa</b> y se guarda en el detalle de la póliza.
      </p>

      <div className="form-grid" style={{ marginBottom: 14, alignItems: 'flex-end' }}>
        <Input label="Fecha de inicio" name="fechaInicioRetarifa" type="date" required
          value={fechaInicio} onChange={cambiarFecha(setFechaInicio)} />
        <Input label="Fecha final" name="fechaFinRetarifa" type="date" required
          min={fechaInicio || undefined} value={fechaFin} onChange={cambiarFecha(setFechaFin)} />
        {/* [V9 §4] Permite retarifar solo los envíos de un transportista. */}
        <Select label="Transportista" name="transportistaRetarifa" value={idTransportista}
          onChange={cambiarTransportista} placeholder="Todos los transportistas"
          options={transportistas.map((t) => ({
            value: t.codigo,
            label: `${t.nombre_comercial} (${t.num_envios} envío${Number(t.num_envios) === 1 ? '' : 's'})`,
          }))} />
        <Button variant="secondary" icon="🔍" onClick={consultar} disabled={loading || !rangoValido}>
          {loading ? 'Consultando...' : 'Consultar tarifas'}
        </Button>
      </div>

      {consultado && (
        <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 10px' }}>
          Alcance: <b>{idTransportista
            ? (transportistas.find((t) => String(t.codigo) === String(idTransportista))?.nombre_comercial || 'transportista')
            : 'todos los transportistas'}</b> de la póliza en el rango indicado.
        </p>
      )}

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
              ) : !consultado ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#6b7280' }}>
                  Indique el rango de fechas y presione «Consultar tarifas».
                </td></tr>
              ) : tarifas.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#6b7280' }}>
                  Esta póliza no tiene envíos con tarifa registrada dentro del rango indicado.
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
