/**
 * DescuentoAdministrativoPage.jsx — pro_descuento_administrativo. Se resta en la Liquidación.
 */
import DescuentoLiquidacionPage from './DescuentoLiquidacionPage';

export default function DescuentoAdministrativoPage() {
  return (
    <DescuentoLiquidacionPage
      recurso="descuentoAdministrativo"
      title="Descuentos Administrativos"
      description="Cargos administrativos por transportista, a descontar en la Liquidación de la póliza."
      newLabel="+ Nuevo descuento"
    />
  );
}
