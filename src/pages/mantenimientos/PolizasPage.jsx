/**
 * PolizasPage.jsx — man_poliza. Selects de empresa y producto.
 * La eliminación se maneja como anulación (cambia el estado a ANULADA).
 */
import CrudPage from '../../components/common/CrudPage';
import PolizaForm from '../../components/forms/PolizaForm';
import Badge from '../../components/common/Badge';
import useRelated, { toOptions } from '../../hooks/useRelated';
import { lookup, formatDate, formatNumber } from '../../utils/formatters';
import { validateForm, required } from '../../utils/validators';

export default function PolizasPage() {
  const { empresas = [], productos = [] } = useRelated({ empresas: 'empresas', productos: 'productos' });
  const empresaOptions = toOptions(empresas, { value: 'codigo', label: 'nombre' });
  const productoOptions = toOptions(productos);

  const columns = [
    { key: 'codigo', label: 'Código' },
    { key: 'nombre_poliza', label: 'Póliza' },
    { key: 'id_empresa', label: 'Empresa', render: (v) => lookup(empresas, v, 'codigo', 'nombre') },
    { key: 'id_producto', label: 'Producto', render: (v) => lookup(productos, v) },
    { key: 'fecha', label: 'Fecha', render: (v) => formatDate(v) },
    { key: 'peso_total', label: 'Peso total (kg)', render: (v) => formatNumber(v, 2) },
    { key: 'estado', label: 'Estado', render: (v) => <Badge value={v} /> },
  ];

  return (
    <CrudPage
      title="Pólizas"
      description="Mantenimiento de pólizas."
      newLabel="+ Nueva póliza"
      recurso="polizas"
      modalSize="lg"
      deleteMode="anular"
      anularEstado="ANULADA"
      columns={columns}
      searchFields={['nombre_poliza', 'descripcion']}
      emptyRecord={{
        nombre_poliza: '', id_empresa: '', id_producto: '', fecha: '', fecha_liquidacion: '',
        descripcion: '', cantidad_bultos: 0, cantidad_piezas: 0, peso_quintales: 0,
        peso_kilogramos: 0, peso_total: 0, estado: 'ABIERTA',
      }}
      validate={(v) => {
        const errs = validateForm(v, {
          nombre_poliza: [required('El nombre es obligatorio')],
          id_empresa: [required('Seleccione una empresa')],
          id_producto: [required('Seleccione un producto')],
          fecha: [required('La fecha es obligatoria')],
        });
        // fecha_liquidacion es obligatoria solo si el estado es LIQUIDADA
        if (v.estado === 'LIQUIDADA' && !v.fecha_liquidacion) {
          errs.fecha_liquidacion = 'Requerida cuando el estado es LIQUIDADA';
        }
        return errs;
      }}
      renderForm={(props) => <PolizaForm {...props} empresaOptions={empresaOptions} productoOptions={productoOptions} />}
    />
  );
}
