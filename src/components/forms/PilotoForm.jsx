/**
 * PilotoForm.jsx
 * Formulario de piloto (man_pilotos). Incluye select de transportista.
 */
import Input from '../common/Input';
import Select from '../common/Select';
import { ESTADO_OPTIONS_BASICO, TIPO_LICENCIA_OPTIONS } from '../../utils/constants';

export function PilotoForm({ values, setField, errors, transportistaOptions = [] }) {
  return (
    <div className="form-grid">
      <Input label="Nombres" name="nombres" value={values.nombres}
        onChange={(e) => setField('nombres', e.target.value)} required error={errors.nombres} />
      <Input label="Apellidos" name="apellidos" value={values.apellidos}
        onChange={(e) => setField('apellidos', e.target.value)} error={errors.apellidos} />
      <Select label="Transportista" name="id_transportista" value={values.id_transportista}
        onChange={(e) => setField('id_transportista', e.target.value)} options={transportistaOptions}
        required error={errors.id_transportista} />
      <Input label="Licencia" name="licencia" value={values.licencia}
        onChange={(e) => setField('licencia', e.target.value)} error={errors.licencia} />
      <Select label="Tipo de licencia" name="tipo_licencia" value={values.tipo_licencia}
        onChange={(e) => setField('tipo_licencia', e.target.value)} options={TIPO_LICENCIA_OPTIONS} error={errors.tipo_licencia} />
      <Input label="Fecha de vigencia" name="fecha_vigencia" type="date" value={values.fecha_vigencia}
        onChange={(e) => setField('fecha_vigencia', e.target.value)} error={errors.fecha_vigencia} />
      <Input label="Teléfono" name="telefono" value={values.telefono}
        onChange={(e) => setField('telefono', e.target.value)} error={errors.telefono} />
      <Select label="Estado" name="estado" value={values.estado}
        onChange={(e) => setField('estado', e.target.value)} options={ESTADO_OPTIONS_BASICO} required error={errors.estado} />
      <Input className="col-span-2" label="Dirección" name="direccion" value={values.direccion}
        onChange={(e) => setField('direccion', e.target.value)} error={errors.direccion} />
    </div>
  );
}

export default PilotoForm;
