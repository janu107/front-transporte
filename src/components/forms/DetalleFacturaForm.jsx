/**
 * DetalleFacturaForm.jsx
 * Formulario de detalle de facturas (pro_detalle_facturas).
 */
import Input from '../common/Input';
import Select from '../common/Select';

export function DetalleFacturaForm({
  values, setField, errors,
  facturaValeOptions = [], polizaOptions = [], transportistaOptions = [], camionOptions = [], pilotoOptions = [],
}) {
  return (
    <div className="form-grid">
      <Input label="Número de vale" name="num_vale" value={values.num_vale}
        onChange={(e) => setField('num_vale', e.target.value)} required error={errors.num_vale} />
      <Select label="Factura / vale" name="id_factura_vale" value={values.id_factura_vale}
        onChange={(e) => setField('id_factura_vale', e.target.value)} options={facturaValeOptions} required error={errors.id_factura_vale} />
      <Select label="Póliza" name="id_poliza" value={values.id_poliza}
        onChange={(e) => setField('id_poliza', e.target.value)} options={polizaOptions} required error={errors.id_poliza} />
      <Select label="Transportista" name="id_transportista" value={values.id_transportista}
        onChange={(e) => setField('id_transportista', e.target.value)} options={transportistaOptions} required error={errors.id_transportista} />
      <Select label="Camión" name="id_camion" value={values.id_camion}
        onChange={(e) => setField('id_camion', e.target.value)} options={camionOptions} error={errors.id_camion} />
      <Select label="Piloto" name="id_piloto" value={values.id_piloto}
        onChange={(e) => setField('id_piloto', e.target.value)} options={pilotoOptions} error={errors.id_piloto} />
      <Input label="Fecha" name="fecha" type="date" value={values.fecha}
        onChange={(e) => setField('fecha', e.target.value)} required error={errors.fecha} />
      <Input label="Cantidad" name="cantidad" type="number" min={0} step="0.01" value={values.cantidad}
        onChange={(e) => setField('cantidad', e.target.value)} error={errors.cantidad} />
      <Input label="Total" name="total" type="number" min={0} step="0.01" value={values.total}
        onChange={(e) => setField('total', e.target.value)} error={errors.total} />
    </div>
  );
}

export default DetalleFacturaForm;
