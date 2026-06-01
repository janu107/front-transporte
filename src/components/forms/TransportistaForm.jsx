/**
 * TransportistaForm.jsx
 * Formulario de transportista (man_transportista).
 */
import Input from '../common/Input';
import Select from '../common/Select';
import { ESTADO_OPTIONS_BASICO } from '../../utils/constants';

export function TransportistaForm({ values, setField, errors }) {
  return (
    <div className="form-grid">
      <Input label="Nombre comercial" name="nombre_comercial" value={values.nombre_comercial}
        onChange={(e) => setField('nombre_comercial', e.target.value)} required error={errors.nombre_comercial} />
      <Input label="NIT" name="nit" value={values.nit}
        onChange={(e) => setField('nit', e.target.value)} error={errors.nit} />
      <Input label="Nombres" name="nombres" value={values.nombres}
        onChange={(e) => setField('nombres', e.target.value)} required error={errors.nombres} />
      <Input label="Apellidos" name="apellidos" value={values.apellidos}
        onChange={(e) => setField('apellidos', e.target.value)} error={errors.apellidos} />
      <Input label="Teléfono" name="telefono" value={values.telefono}
        onChange={(e) => setField('telefono', e.target.value)} error={errors.telefono} />
      <Input label="Correo" name="correo" type="email" value={values.correo}
        onChange={(e) => setField('correo', e.target.value)} error={errors.correo} />
      <Input className="col-span-2" label="Dirección" name="direccion" value={values.direccion}
        onChange={(e) => setField('direccion', e.target.value)} error={errors.direccion} />
      <Input label="Impuesto (%)" name="impuesto" type="number" min={0} value={values.impuesto}
        onChange={(e) => setField('impuesto', e.target.value)} error={errors.impuesto} />
      <Select label="Estado" name="estado" value={values.estado}
        onChange={(e) => setField('estado', e.target.value)} options={ESTADO_OPTIONS_BASICO} required error={errors.estado} />
    </div>
  );
}

export default TransportistaForm;
