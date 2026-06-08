export default function Pagination({ page, totalPages, total, onPrev, onNext }) {
  return (
    <div>
      {/* IMPORTANTE: data-value com valores numericos para o bench */}
      <span className="pagination-current" data-value={page}>
        Pagina {page}
      </span>
      {' de '}
      <span className="pagination-pages" data-value={totalPages}>
        {totalPages}
      </span>
      {' | '}
      <span className="pagination-total" data-value={total}>
        {total} transacoes
      </span>

      <div>
        <button
          className="btn-prev-page"
          onClick={onPrev}
          disabled={page <= 1}
        >
          Anterior
        </button>
        <button
          className="btn-next-page"
          onClick={onNext}
          disabled={page >= totalPages}
        >
          Proxima
        </button>
      </div>
    </div>
  )
}
