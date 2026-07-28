/**
 * DescuentoLiquidacionForm.jsx
 * Formulario compartido por los descuentos que se restan en la Liquidación
 * (Aceite y Administrativos: mismos campos en pro_descuento_aceite /
 * pro_descuento_administrativo). Póliza limitada a ABIERTA.
 */
import Input from '../common/Input';
import Select from '../common/Select';
import { ESTADO_OPTIONS_ACTIVO_ANULADO } from '../../utils/constants';

export function DescuentoLiquidacionForm({
  values, setField, errors,
  polizaOptions = [], transportistaOptions = [],
}) {
  return (
    <div className="form-grid">
      <Select label="Póliza (ABIERTA)" name="id_poliza" value={values.id_poliza}
        onChange={(e) => setField('id_poliza', e.target.value)} options={polizaOptions} required error={errors.id_poliza} />
      <Select label="Transportista" name="id_transportista" value={values.id_transportista}
        onChange={(e) => setField('id_transportista', e.target.value)} options={transportistaOptions} required error={errors.id_transportista} />
      <Input label="Fecha" name="fecha" type="date" value={values.fecha}
        onChange={(e) => setField('fecha', e.target.value)} required error={errors.fecha} />
      <Input label="Valor" name="valor" type="number" min={0} step="0.01" value={values.valor}
        onChange={(e) => setField('valor', e.target.value)} required error={errors.valor} />
      <Select label="Estado" name="estado" value={values.estado}
        onChange={(e) => setField('estado', e.target.value)} options={ESTADO_OPTIONS_ACTIVO_ANULADO} required error={errors.estado} />
      <Input className="col-span-2" label="Descripción" name="descripcion" value={values.descripcion}
        onChange={(e) => setField('descripcion', e.target.value)} error={errors.descripcion} />
    </div>
  );
}

export default DescuentoLiquidacionForm;
