/**
 * FacturaValeForm.jsx
 * Formulario de factura/vale (man_facturas_vales). Selects de producto y bomba.
 * El saldo se calcula visualmente como unidades * precio (puede ajustarse).
 */
import { useEffect } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import { ESTADO_OPTIONS_FACTURA } from '../../utils/constants';

export function FacturaValeForm({ values, setField, errors, productoOptions = [], bombaOptions = [] }) {
  // Apoyo visual: saldo sugerido = unidades * precio (solo si el saldo está vacío
  // o coincide con el cálculo previo, para no pisar ediciones manuales).
  useEffect(() => {
    const calc = (Number(values.unidades) || 0) * (Number(values.precio) || 0);
    setField('saldo', Number(calc.toFixed(2)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.unidades, values.precio]);

  return (
    <div className="form-grid">
      <Input label="Factura" name="factura" value={values.factura}
        onChange={(e) => setField('factura', e.target.value)} required error={errors.factura} />
      <Select label="Producto" name="id_producto" value={values.id_producto}
        onChange={(e) => setField('id_producto', e.target.value)} options={productoOptions} required error={errors.id_producto} />
      <Select label="Bomba" name="id_bomba" value={values.id_bomba}
        onChange={(e) => setField('id_bomba', e.target.value)} options={bombaOptions} required error={errors.id_bomba} />
      <Input label="Fecha" name="fecha" type="date" value={values.fecha}
        onChange={(e) => setField('fecha', e.target.value)} required error={errors.fecha} />
      <Input label="Unidades" name="unidades" type="number" min={0} value={values.unidades}
        onChange={(e) => setField('unidades', e.target.value)} error={errors.unidades} />
      <Input label="Precio" name="precio" type="number" min={0} step="0.01" value={values.precio}
        onChange={(e) => setField('precio', e.target.value)} error={errors.precio} />
      <Input label="Saldo" name="saldo" type="number" min={0} step="0.01" value={values.saldo}
        onChange={(e) => setField('saldo', e.target.value)} error={errors.saldo} />
      <Select label="Estado" name="estado" value={values.estado}
        onChange={(e) => setField('estado', e.target.value)} options={ESTADO_OPTIONS_FACTURA} required error={errors.estado} />
      <Input className="col-span-2" label="Descripción de compra" name="descripcion_compra" value={values.descripcion_compra}
        onChange={(e) => setField('descripcion_compra', e.target.value)} error={errors.descripcion_compra} />
    </div>
  );
}

export default FacturaValeForm;
