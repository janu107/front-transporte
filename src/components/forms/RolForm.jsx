/**
 * RolForm.jsx
 * Formulario de rol (adm_roles).
 */
import Input from '../common/Input';
import Select from '../common/Select';
import { ESTADO_OPTIONS_BASICO } from '../../utils/constants';

export function RolForm({ values, setField, errors }) {
  return (
    <div className="form-grid">
      <Input
        label="Tipo de rol"
        name="tipo_rol"
        value={values.tipo_rol}
        onChange={(e) => setField('tipo_rol', e.target.value)}
        required
        error={errors.tipo_rol}
        placeholder="Ej. ADMIN, OPERADOR"
      />
      <Select
        label="Estado"
        name="estado"
        value={values.estado}
        onChange={(e) => setField('estado', e.target.value)}
        options={ESTADO_OPTIONS_BASICO}
        required
        error={errors.estado}
      />
      <Input
        className="col-span-2"
        label="Descripción"
        name="descripcion"
        value={values.descripcion}
        onChange={(e) => setField('descripcion', e.target.value)}
        error={errors.descripcion}
      />
    </div>
  );
}

export default RolForm;
