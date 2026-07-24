/**
 * LiquidacionesPage.jsx — LIQUIDACIÓN DE PÓLIZAS.
 * Flujo: elegir póliza ABIERTA → cargar resumen por transportista → confirmar (cierra la póliza).
 * Los cálculos se hacen en el backend (GET /liquidacion/resumen, POST /liquidacion/confirmar).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import realApi from '../../api/realApi';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export default function LiquidacionesPage() {
  const [polizas, setPolizas] = useState([]);
  const [idPoliza, setIdPoliza] = useState('');
  const [resumen, setResumen] = useState(null); // null = no consultado; [] = sin movimientos
  const [cargandoResumen, setCargandoResumen] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState(null);

  const notify = useCallback((type, text) => {
    setMessage({ type, text });
    if (type !== 'error') setTimeout(() => setMessage(null), 8000);
  }, []);

  const cargarPolizas = useCallback(async () => {
    try {
      const data = await realApi.list('polizas');
      setPolizas(data.filter((p) => String(p.estado).toUpperCase() === 'ABIERTA'));
    } catch (e) {
      notify('error', e?.userMessage || 'No se pudieron cargar las pólizas.');
    }
  }, [notify]);

  useEffect(() => { cargarPolizas(); }, [cargarPolizas]);

  const polizaOptions = useMemo(
    () => polizas.map((p) => ({ value: p.codigo, label: p.nombre_poliza })),
    [polizas]
  );

  const onChangePoliza = (value) => {
    setIdPoliza(value);
    setResumen(null);
    setMessage(null);
  };

  const cargarResumen = async () => {
    if (!idPoliza) { notify('error', 'Seleccione una póliza.'); return; }
    setCargandoResumen(true);
    setMessage(null);
    try {
      const data = await realApi.liquidacionResumen(idPoliza);
      setResumen(data.transportistas || []);
    } catch (e) {
      setResumen(null);
      notify('error', e?.userMessage || e?.response?.data?.message || 'No se pudo cargar el resumen.');
    } finally {
      setCargandoResumen(false);
    }
  };

  const confirmar = async () => {
    setConfirmOpen(false);
    if (confirmando) return; // evita doble clic
    setConfirmando(true);
    setMessage(null);
    try {
      const r = await realApi.liquidacionConfirmar(idPoliza);
      notify('success', r.mensaje || 'Liquidación confirmada.');
      // La póliza quedó cerrada: limpiar y recargar la lista de abiertas.
      setResumen(null);
      setIdPoliza('');
      await cargarPolizas();
    } catch (e) {
      notify('error', e?.userMessage || e?.response?.data?.message || 'No se pudo confirmar la liquidación.');
    } finally {
      setConfirmando(false);
    }
  };

  const totalLiquido = useMemo(
    () => (resumen || []).reduce((s, t) => s + Number(t.liquido || 0), 0),
    [resumen]
  );

  const hayMovimientos = Array.isArray(resumen) && resumen.length > 0;

  return (
    <div>
      <PageHeader
        title="Liquidación de Pólizas"
        description="Calcula y confirma la liquidación por transportista de una póliza abierta."
      />

      {message && <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>}

      {/* Selector de póliza + acciones */}
      <div className="toolbar" style={{ alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 280 }}>
          <Select
            label="Póliza (ABIERTA)"
            name="idPoliza"
            value={idPoliza}
            onChange={(e) => onChangePoliza(e.target.value)}
            options={polizaOptions}
            placeholder={polizaOptions.length ? 'Seleccione póliza...' : 'No hay pólizas abiertas'}
          />
        </div>
        <Button variant="secondary" icon="🔍" onClick={cargarResumen} disabled={!idPoliza || cargandoResumen}>
          {cargandoResumen ? 'Cargando...' : 'Cargar resumen'}
        </Button>
        <div className="spacer" />
        <Button
          variant="primary"
          icon="✅"
          onClick={() => setConfirmOpen(true)}
          disabled={!hayMovimientos || confirmando}
        >
          {confirmando ? 'Confirmando...' : 'Confirmar liquidación'}
        </Button>
      </div>

      {/* Resumen por transportista */}
      <div className="table-wrapper">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>NIT</th>
                <th>Transportista</th>
                <th style={{ textAlign: 'right' }}>Viajes</th>
                <th style={{ textAlign: 'right' }}>Valor viajes</th>
                <th style={{ textAlign: 'right' }}>Anticipos</th>
                <th style={{ textAlign: 'right' }}>Combustible</th>
                <th style={{ textAlign: 'right' }}>Sobregiro ant.</th>
                <th style={{ textAlign: 'right' }}>Descuentos</th>
                <th style={{ textAlign: 'right' }}>Líquido</th>
              </tr>
            </thead>
            <tbody>
              {resumen === null ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                  Seleccione una póliza y presione «Cargar resumen».
                </td></tr>
              ) : cargandoResumen ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40 }}>Cargando...</td></tr>
              ) : !hayMovimientos ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                  Esta póliza no tiene movimientos de transportistas.
                </td></tr>
              ) : (
                resumen.map((t) => (
                  <tr key={t.id_transportista}>
                    <td>{t.nit || '-'}</td>
                    <td>{t.nombre || '-'}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(t.cantidad_viajes, 0)}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(t.valor_viajes)}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(t.valor_anticipos)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {formatCurrency(t.valor_combustible)}
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{formatNumber(t.total_galones)} gal</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(t.sobregiro_anterior)}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(t.total_descuentos)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: Number(t.liquido) < 0 ? '#c1121f' : '#15803d' }}>
                      {formatCurrency(t.liquido)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {hayMovimientos && (
              <tfoot>
                <tr style={{ borderTop: '2px solid #e5e7eb', fontWeight: 700 }}>
                  <td colSpan={8} style={{ textAlign: 'right' }}>Total líquido a pagar</td>
                  <td style={{ textAlign: 'right', color: totalLiquido < 0 ? '#c1121f' : '#15803d' }}>
                    {formatCurrency(totalLiquido)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {hayMovimientos && (
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
          Los líquidos <b>negativos</b> se registran como sobregiro pendiente para la siguiente póliza del transportista.
          Al confirmar, la póliza queda <b>LIQUIDADA</b> y no se puede volver a liquidar.
        </p>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmar}
        title="Confirmar liquidación"
        confirmText="Confirmar y cerrar póliza"
        message="¿Confirma la liquidación de esta póliza? Se guardarán los montos por transportista, se aplicarán/generarán sobregiros y la póliza quedará CERRADA (LIQUIDADA). Esta acción no se puede deshacer."
      />
    </div>
  );
}
