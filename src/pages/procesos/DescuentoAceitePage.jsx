/**
 * DescuentoAceitePage.jsx — pro_descuento_aceite. Se resta en la Liquidación.
 */
import DescuentoLiquidacionPage from './DescuentoLiquidacionPage';

export default function DescuentoAceitePage() {
  return (
    <DescuentoLiquidacionPage
      recurso="descuentoAceite"
      title="Descuentos de Aceite"
      description="Cargos de aceite por transportista, a descontar en la Liquidación de la póliza."
      newLabel="+ Nuevo descuento"
    />
  );
}
