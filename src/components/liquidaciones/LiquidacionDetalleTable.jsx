import { Fragment, useState } from 'react';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';

const right = { textAlign: 'right' };

/** Desglose reutilizable de una liquidación y sus vales de diesel. */
export default function LiquidacionDetalleTable({ items = [], loading = false, emptyText = 'Sin movimientos.' }) {
  const [abierto, setAbierto] = useState(null);

  return (
    <div className="table-wrapper table-wrapper--cards">
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Transportista</th>
              <th style={right}>Viajes</th>
              <th style={right}>Diesel</th>
              <th style={right}>Anticipos</th>
              <th style={right}>Base gravable</th>
              <th style={right}>% impuesto</th>
              <th style={right}>Impuesto</th>
              <th style={right}>Total a facturar</th>
              <th style={right}>Suministro</th>
              <th style={right}>Sobregiro ant.</th>
              <th style={right}>Total a pagar</th>
              <th>Vales</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} style={{ textAlign: 'center', padding: 36 }}>Cargando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={12} style={{ textAlign: 'center', padding: 36, color: '#6b7280' }}>{emptyText}</td></tr>
            ) : items.map((row) => {
              const key = row.id_transportista;
              const vales = row.vales || [];
              const expandido = String(abierto) === String(key);
              const total = Number(row.valor_liquidacion || 0);
              return (
                <Fragment key={key}>
                  <tr>
                    <td data-label="Transportista">
                      <b>{row.nombre || row.nombre_comercial || '—'}</b>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{row.nit || ''}</div>
                    </td>
                    <td data-label="Viajes" style={right}>
                      {formatNumber(row.cantidad_viajes, 0)}
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{formatCurrency(row.valor_viajes)}</div>
                    </td>
                    <td data-label="Diesel" style={right}>{formatCurrency(row.valor_diesel)}</td>
                    <td data-label="Anticipos" style={right}>{formatCurrency(row.valor_anticipos)}</td>
                    <td data-label="Base gravable" style={right}>{formatCurrency(row.base_gravable)}</td>
                    <td data-label="% impuesto" style={right}>{formatNumber(row.porcentaje_impuesto)}%</td>
                    <td data-label="Impuesto" style={right}>{formatCurrency(row.valor_impuesto)}</td>
                    <td data-label="Total a facturar" style={right}>{formatCurrency(row.total_facturar)}</td>
                    <td data-label="Suministro" style={right}>{formatCurrency(row.suministro)}</td>
                    <td data-label="Sobregiro anterior" style={right}>{formatCurrency(row.sobregiro_anterior)}</td>
                    <td data-label="Total a pagar" style={{ ...right, fontWeight: 700, color: total < 0 ? '#c1121f' : '#15803d' }}>
                      {formatCurrency(total)}
                      {total < 0 && <div style={{ fontSize: 10 }}>Sobregiro</div>}
                    </td>
                    <td data-label="Vales">
                      {vales.length ? (
                        <button type="button" style={linkButton}
                          onClick={() => setAbierto(expandido ? null : key)}>
                          {expandido ? 'Ocultar' : `Ver (${vales.length})`}
                        </button>
                      ) : '—'}
                    </td>
                  </tr>
                  {expandido && (
                    <tr>
                      <td colSpan={12} style={{ padding: '10px 18px', background: '#f8fafc' }}>
                        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6 }}>Vales de diesel incluidos</div>
                        <div className="table-scroll">
                          <table className="data-table" style={{ margin: 0 }}>
                            <thead><tr><th>N° vale</th><th>Factura</th><th>Fecha</th><th style={right}>Galones</th><th style={right}>Precio</th><th style={right}>Total</th></tr></thead>
                            <tbody>{vales.map((vale) => (
                              <tr key={vale.correlativo}>
                                <td>{vale.num_vale || '—'}</td><td>{vale.factura || '—'}</td>
                                <td>{formatDate(vale.fecha)}</td>
                                <td style={right}>{formatNumber(vale.galones)}</td>
                                <td style={right}>{formatCurrency(vale.precio)}</td>
                                <td style={right}>{formatCurrency(vale.total)}</td>
                              </tr>
                            ))}</tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const linkButton = {
  border: 0, background: 'transparent', color: '#c1121f', cursor: 'pointer',
  fontWeight: 600, padding: '4px 0', whiteSpace: 'nowrap',
};
