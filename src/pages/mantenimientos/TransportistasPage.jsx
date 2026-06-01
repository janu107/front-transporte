/**
 * TransportistasPage.jsx — man_transportista.
 */
import CrudPage from '../../components/common/CrudPage';
import TransportistaForm from '../../components/forms/TransportistaForm';
import Badge from '../../components/common/Badge';
import { validateForm, required, email, nonNegative } from '../../utils/validators';

const columns = [
  { key: 'codigo', label: 'Código' },
  { key: 'nombre_comercial', label: 'Nombre comercial' },
  { key: 'nit', label: 'NIT' },
  { key: 'nombres', label: 'Nombres' },
  { key: 'apellidos', label: 'Apellidos' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'estado', label: 'Estado', render: (v) => <Badge value={v} /> },
];

export default function TransportistasPage() {
  return (
    <CrudPage
      title="Transportistas"
      description="Mantenimiento de transportistas."
      newLabel="+ Nuevo transportista"
      recurso="transportistas"
      columns={columns}
      searchFields={['nombre_comercial', 'nit', 'nombres', 'apellidos']}
      emptyRecord={{ nombre_comercial: '', nit: '', nombres: '', apellidos: '', direccion: '', telefono: '', correo: '', impuesto: 0, estado: 'ACTIVO' }}
      validate={(v) =>
        validateForm(v, {
          nombre_comercial: [required('El nombre comercial es obligatorio')],
          nombres: [required('Los nombres son obligatorios')],
          correo: [email('Correo no válido')],
          impuesto: [nonNegative('El impuesto no puede ser negativo')],
          estado: [required('Seleccione un estado')],
        })
      }
      renderForm={(props) => <TransportistaForm {...props} />}
    />
  );
}
