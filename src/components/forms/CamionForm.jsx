/**
 * CamionForm.jsx
 * Formulario de camión (man_camion). Selects de transportista y tipo de camión.
 */
import Input from '../common/Input';
import Select from '../common/Select';
import SearchableSelect from '../common/SearchableSelect';

export function CamionForm({ values, setField, errors, transportistaOptions = [], tipoCamionOptions = [] }) {
  return (
    <div className="form-grid">
      <Input label="Placa" name="placa" value={values.placa}
        onChange={(e) => setField('placa', e.target.value)} required error={errors.placa} />
      {/* Buscable: el catálogo de transportistas es largo (mismo caso que en Pilotos). */}
      <SearchableSelect label="Transportista" name="id_transportista" value={values.id_transportista}
        onChange={(v) => setField('id_transportista', v)} options={transportistaOptions}
        placeholder="Escriba para buscar transportista..."
        required error={errors.id_transportista} />
      <Select label="Tipo de camión" name="id_tipo_camion" value={values.id_tipo_camion}
        onChange={(e) => setField('id_tipo_camion', e.target.value)} options={tipoCamionOptions}
        required error={errors.id_tipo_camion} />
      <Input label="Marca" name="marca" value={values.marca}
        onChange={(e) => setField('marca', e.target.value)} error={errors.marca} />
      <Input label="Color" name="color" value={values.color}
        onChange={(e) => setField('color', e.target.value)} error={errors.color} />
      <Input label="Año" name="anio" type="number" min={0} value={values.anio}
        onChange={(e) => setField('anio', e.target.value)} error={errors.anio} />
    </div>
  );
}

export default CamionForm;
