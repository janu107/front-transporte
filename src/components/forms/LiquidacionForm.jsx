/**
 * LiquidacionForm.jsx
 * Formulario de liquidación (pro_liquidaciones).
 * valor_liquidacion se calcula visualmente:
 *   valor_liquidacion = valor_viajes + valor_vales - valor_anticipos
 */
import { useEffect } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import { ESTADO_OPTIONS_LIQUIDACION } from '../../utils/constants';

export function LiquidacionForm({ values, setField, errors, polizaOptions = [], transportistaOptions = [] }) {
  useEffect(() => {
    const total =
      (Number(values.valor_viajes) || 0) +
      (Number(values.valor_vales) || 0) -
      (Number(values.valor_anticipos) || 0);
    setField('valor_liquidacion', Number(total.toFixed(2)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.valor_viajes, values.valor_vales, values.valor_anticipos]);

  return (
    <div className="form-grid">
      <Input label="Número de liquidación" name="num_liquidacion" value={values.num_liquidacion}
        onChange={(e) => setField('num_liquidacion', e.target.value)} required error={errors.num_liquidacion} />
      <Select label="Póliza" name="id_poliza" value={values.id_poliza}
        onChange={(e) => setField('id_poliza', e.target.value)} options={polizaOptions} required error={errors.id_poliza} />
      <Select label="Transportista" name="id_transportista" value={values.id_transportista}
        onChange={(e) => setField('id_transportista', e.target.value)} options={transportistaOptions} required error={errors.id_transportista} />
      <Input label="Cantidad viajes" name="cantidad_viajes" type="number" min={0} value={values.cantidad_viajes}
        onChange={(e) => setField('cantidad_viajes', e.target.value)} error={errors.cantidad_viajes} />
      <Input label="Valor viajes" name="valor_viajes" type="number" min={0} step="0.01" value={values.valor_viajes}
        onChange={(e) => setField('valor_viajes', e.target.value)} error={errors.valor_viajes} />
      <Input label="Cantidad vale" name="cantidad_vale" type="number" min={0} value={values.cantidad_vale}
        onChange={(e) => setField('cantidad_vale', e.target.value)} error={errors.cantidad_vale} />
      <Input label="Valor vales" name="valor_vales" type="number" min={0} step="0.01" value={values.valor_vales}
        onChange={(e) => setField('valor_vales', e.target.value)} error={errors.valor_vales} />
      <Input label="Cantidad anticipos" name="cantidad_anticipos" type="number" min={0} value={values.cantidad_anticipos}
        onChange={(e) => setField('cantidad_anticipos', e.target.value)} error={errors.cantidad_anticipos} />
      <Input label="Valor anticipos" name="valor_anticipos" type="number" min={0} step="0.01" value={values.valor_anticipos}
        onChange={(e) => setField('valor_anticipos', e.target.value)} error={errors.valor_anticipos} />
      <Input label="Valor liquidación" name="valor_liquidacion" type="number" value={values.valor_liquidacion} disabled
        onChange={() => {}} />
      <Select label="Estado" name="estado" value={values.estado}
        onChange={(e) => setField('estado', e.target.value)} options={ESTADO_OPTIONS_LIQUIDACION} required error={errors.estado} />
      <Input label="Fecha de liquidación" name="fecha_liquidacion" type="date" value={values.fecha_liquidacion}
        onChange={(e) => setField('fecha_liquidacion', e.target.value)} error={errors.fecha_liquidacion} />
    </div>
  );
}

export default LiquidacionForm;
