/**
 * TarifaEmbarquePage.jsx — Catálogo cat_tarifa_embarque
 * (codigo, descripcion, origen, destino, valor, estado).
 */
import CrudPage from '../../components/common/CrudPage';
import CatalogoSimpleForm from '../../components/forms/CatalogoSimpleForm';
import Badge from '../../components/common/Badge';
import { formatCurrency } from '../../utils/formatters';
import { validateForm, required, nonNegative } from '../../utils/validators';
import { ESTADO_OPTIONS_BASICO } from '../../utils/constants';

const columns = [
  { key: 'codigo', label: 'Código' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'origen', label: 'Origen' },
  { key: 'destino', label: 'Destino' },
  { key: 'valor', label: 'Valor', render: (v) => formatCurrency(v) },
  { key: 'estado', label: 'Estado', render: (v) => <Badge value={v} /> },
];

const extraFields = [
  { name: 'origen', label: 'Origen', type: 'text' },
  { name: 'destino', label: 'Destino', type: 'text' },
  { name: 'valor', label: 'Valor', type: 'number' },
  { name: 'estado', label: 'Estado', type: 'select', required: true, options: ESTADO_OPTIONS_BASICO },
];

export default function TarifaEmbarquePage() {
  return (
    <CrudPage
      title="Tarifa de Embarque"
      description="Catálogo de tarifas de embarque por origen y destino."
      newLabel="+ Nueva tarifa"
      recurso="tarifaEmbarque"
      columns={columns}
      searchFields={['descripcion', 'origen', 'destino']}
      emptyRecord={{ descripcion: '', origen: '', destino: '', valor: 0, estado: 'ACTIVO' }}
      validate={(v) =>
        validateForm(v, {
          descripcion: [required('La descripción es obligatoria')],
          valor: [nonNegative('El valor no puede ser negativo')],
        })
      }
      renderForm={(props) => <CatalogoSimpleForm {...props} extraFields={extraFields} />}
    />
  );
}
