/**
 * FacturaValeForm.jsx
 * Formulario de factura/vale (man_facturas_vales). Selects de producto y bomba.
 *
 * El SALDO está en UNIDADES (galones), no en quetzales: es el combustible que
 * queda por despachar. Cada vale que se emite le resta sus galones.
 */
import { useEffect } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { ESTADO_OPTIONS_FACTURA_VALE } from '../../utils/constants';

export function FacturaValeForm({
  values, setField, errors, isEdit = false,
  productoOptions = [], bombaOptions = [],
  // Los estados los decide la pantalla según lo que admita la columna; la
  // lista fija queda solo como respaldo.
  estadoOptions = ESTADO_OPTIONS_FACTURA_VALE,
}) {
  // [2026-09] El SALDO se lleva en UNIDADES, no en valor monetario. Antes se
  // sugería unidades × precio, y por eso una factura de 5,000 galones nacía con
  // saldo 62,229.33: un monto, no galones. Al crear, el saldo arranca igual a
  // las unidades compradas (nada despachado todavía).
  // Al EDITAR no se toca: ahí ya es el saldo real, ya consumido por los vales.
  useEffect(() => {
    if (isEdit) return;
    setField('saldo', Number((Number(values.unidades) || 0).toFixed(2)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.unidades, isEdit]);

  const unidades = Number(values.unidades) || 0;
  const precio = Number(values.precio) || 0;
  const saldo = Number(values.saldo) || 0;

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
      <Input label="Unidades compradas (galones)" name="unidades" type="number" min={0} step="0.01"
        value={values.unidades}
        onChange={(e) => setField('unidades', e.target.value)} error={errors.unidades} />
      <Input label="Precio por galón" name="precio" type="number" min={0} step="0.01" value={values.precio}
        onChange={(e) => setField('precio', e.target.value)} error={errors.precio}
        hint={unidades > 0 && precio > 0 ? `Compra: ${formatCurrency(unidades * precio)}` : undefined} />
      <Input label="Saldo (galones por despachar)" name="saldo" type="number" min={0} step="0.01"
        value={values.saldo}
        onChange={(e) => setField('saldo', e.target.value)} error={errors.saldo}
        hint={isEdit
          ? `Despachados: ${formatNumber(Math.max(unidades - saldo, 0))} gal de ${formatNumber(unidades)} gal`
          : 'Arranca igual a las unidades compradas'} />
      <Select label="Estado" name="estado" value={values.estado}
        onChange={(e) => setField('estado', e.target.value)}
        options={estadoOptions} required error={errors.estado} />
      <Input className="col-span-2" label="Descripción de compra" name="descripcion_compra" value={values.descripcion_compra}
        onChange={(e) => setField('descripcion_compra', e.target.value)} error={errors.descripcion_compra} />
    </div>
  );
}

export default FacturaValeForm;
