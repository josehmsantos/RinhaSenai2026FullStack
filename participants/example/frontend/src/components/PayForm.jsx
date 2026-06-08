import { useState } from 'react'

export default function PayForm({ onSubmit }) {
  const [form, setForm] = useState({
    card_number: '',
    holder_name: '',
    expiration: '',
    cvv: '',
    amount_cents: '',
    installments: '1',
    description: '',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Gera idempotency_key unico para cada submit
    const idempotencyKey = crypto.randomUUID()

    onSubmit({
      idempotency_key: idempotencyKey,
      card_number: form.card_number,
      holder_name: form.holder_name,
      expiration: form.expiration,
      cvv: form.cvv,
      amount_cents: parseInt(form.amount_cents) || 0,
      installments: parseInt(form.installments) || 1,
      description: form.description,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* IMPORTANTE: cada input precisa da classe .input-* ou .select-* */}
      <div>
        <label>Numero do Cartao</label>
        <input
          className="input-card-number"
          name="card_number"
          value={form.card_number}
          onChange={handleChange}
          placeholder="4111111111111111"
        />
      </div>
      <div>
        <label>Nome do Titular</label>
        <input
          className="input-holder-name"
          name="holder_name"
          value={form.holder_name}
          onChange={handleChange}
          placeholder="Joao Silva"
        />
      </div>
      <div>
        <label>Validade</label>
        <input
          className="input-expiration"
          name="expiration"
          value={form.expiration}
          onChange={handleChange}
          placeholder="12/28"
        />
      </div>
      <div>
        <label>CVV</label>
        <input
          className="input-cvv"
          name="cvv"
          value={form.cvv}
          onChange={handleChange}
          placeholder="123"
        />
      </div>
      <div>
        <label>Valor (centavos)</label>
        <input
          className="input-amount"
          name="amount_cents"
          type="number"
          value={form.amount_cents}
          onChange={handleChange}
          placeholder="15000"
        />
      </div>
      <div>
        <label>Parcelas</label>
        <select
          className="select-installments"
          name="installments"
          value={form.installments}
          onChange={handleChange}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}x
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Descricao</label>
        <input
          className="input-description"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Camiseta SENAI"
        />
      </div>
      <button type="submit" className="btn-pay">
        Pagar
      </button>
    </form>
  )
}
