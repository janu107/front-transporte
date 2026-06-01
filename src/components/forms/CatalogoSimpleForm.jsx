/**
 * CatalogoSimpleForm.jsx
 * Formulario genérico para catálogos simples (solo descripción) y variantes con
 * campos adicionales opcionales. Reutilizado por varios catálogos.
 *
 * Props: { values, setField, errors, extraFields }
 *   extraFields: [{ name, label, type, required, options, placeholder }]
 */
import Input from '../common/Input';
import Select from '../common/Select';

export function CatalogoSimpleForm({ values, setField, errors, extraFields = [], descripcionLabel = 'Descripción' }) {
  return (
    <div className="form-grid">
      <Input
        className="col-span-2"
        label={descripcionLabel}
        name="descripcion"
        value={values.descripcion}
        onChange={(e) => setField('descripcion', e.target.value)}
        required
        error={errors.descripcion}
        placeholder={`Ingrese ${descripcionLabel.toLowerCase()}`}
      />

      {extraFields.map((f) => {
        const common = {
          key: f.name,
          className: f.fullWidth ? 'col-span-2' : '',
          label: f.label,
          name: f.name,
          value: values[f.name],
          required: f.required,
          error: errors[f.name],
        };
        if (f.type === 'select') {
          return (
            <Select
              {...common}
              options={f.options || []}
              onChange={(e) => setField(f.name, e.target.value)}
              placeholder={f.placeholder}
            />
          );
        }
        return (
          <Input
            {...common}
            type={f.type || 'text'}
            onChange={(e) => setField(f.name, e.target.value)}
            placeholder={f.placeholder}
            min={f.type === 'number' ? 0 : undefined}
          />
        );
      })}
    </div>
  );
}

export default CatalogoSimpleForm;
