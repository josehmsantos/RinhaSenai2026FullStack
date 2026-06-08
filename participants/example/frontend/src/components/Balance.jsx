export default function Balance({ data }) {
  if (!data) return <p>Carregando saldo...</p>

  return (
    <div>
      <h2>Resumo</h2>
      {/* IMPORTANTE: data-value com o valor bruto para o bench ler */}
      <p>
        Saldo:{' '}
        <span className="display-balance" data-value={data.balance_cents}>
          R$ {(data.balance_cents / 100).toFixed(2)}
        </span>
      </p>
      <p>
        Aprovadas:{' '}
        <span className="display-total-approved" data-value={data.total_approved}>
          {data.total_approved}
        </span>
      </p>
      <p>
        Recusadas:{' '}
        <span className="display-total-declined" data-value={data.total_declined}>
          {data.total_declined}
        </span>
      </p>
      <p>
        Estornadas:{' '}
        <span className="display-total-refunded" data-value={data.total_refunded}>
          {data.total_refunded}
        </span>
      </p>
    </div>
  )
}
