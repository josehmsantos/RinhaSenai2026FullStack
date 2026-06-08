import { useState, useEffect } from 'react'
import PayForm from '../components/PayForm.jsx'
import Balance from '../components/Balance.jsx'

export default function Dashboard() {
  const [feedback, setFeedback] = useState(null) // { type: 'success' | 'error', message }
  const [balanceData, setBalanceData] = useState(null)

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/balance')
      const data = await res.json()
      setBalanceData(data)
    } catch (err) {
      console.error('Erro ao buscar saldo:', err)
    }
  }

  useEffect(() => {
    fetchBalance()
  }, [])

  const handlePayment = async (formData) => {
    setFeedback(null)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (res.status === 201 || res.status === 200) {
        if (data.status === 'declined') {
          setFeedback({ type: 'error', message: `Transacao recusada (${data.card_brand})` })
        } else {
          setFeedback({ type: 'success', message: `Pagamento aprovado! ID: ${data.id}` })
        }
      } else {
        setFeedback({ type: 'error', message: data.error || 'Erro ao processar pagamento' })
      }

      fetchBalance()
    } catch (err) {
      setFeedback({ type: 'error', message: 'Erro de conexao com o servidor' })
    }
  }

  return (
    <div>
      <h1>Gateway de Pagamento</h1>

      <PayForm onSubmit={handlePayment} />

      {/* IMPORTANTE: o bench procura .feedback-success e .feedback-error */}
      {feedback?.type === 'success' && (
        <div className="feedback-success">{feedback.message}</div>
      )}
      {feedback?.type === 'error' && (
        <div className="feedback-error">{feedback.message}</div>
      )}

      <Balance data={balanceData} />
    </div>
  )
}
