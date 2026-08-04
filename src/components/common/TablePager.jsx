/**
 * TablePager.jsx — [2026-08 §1/§3] Pie de paginación reutilizable (mismo estilo que
 * DataTable) para las pantallas con <table> propia. Se alimenta del hook usePagination.
 */
export default function TablePager({ page, setPage, total, totalPaginas, desde, hasta, pageSize }) {
  if (!total) return null;
  return (
    <div className="table-footer">
      <span>
        {total > pageSize
          ? `Mostrando ${desde}–${hasta} de ${total} registro(s)`
          : `${total} registro(s)`}
      </span>
      {totalPaginas > 1 && (
        <div className="table-pager">
          <button type="button" className="pager-btn" onClick={() => setPage(1)} disabled={page <= 1} title="Primera">«</button>
          <button type="button" className="pager-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>‹ Anterior</button>
          <span className="pager-info">Página {page} de {totalPaginas}</span>
          <button type="button" className="pager-btn" onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))} disabled={page >= totalPaginas}>Siguiente ›</button>
          <button type="button" className="pager-btn" onClick={() => setPage(totalPaginas)} disabled={page >= totalPaginas} title="Última">»</button>
        </div>
      )}
    </div>
  );
}
