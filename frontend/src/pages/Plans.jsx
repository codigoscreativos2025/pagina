import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const PLANS = [
  { id: 1, name: 'Gratis', price: 0, messages: 50, features: ['1 agente', '50 mensajes/mes', 'Soporte básico'] },
  { id: 2, name: 'Starter', price: 19.99, messages: 500, features: ['1 agente', '500 mensajes/mes', 'Google Sheets', 'Soporte优先级'] },
  { id: 3, name: 'Pro', price: 49.99, messages: 2000, features: ['1 agente', '2000 mensajes/mes', 'Google Sheets', 'Múltiples canales'] },
  { id: 4, name: 'Business', price: 99.99, messages: 10000, features: ['1 agente', '10000 mensajes/mes', 'API Access', 'Soporte dedicado'] },
  { id: 5, name: 'Enterprise', price: 299.99, messages: -1, features: ['Agentes ilimitados', 'Ilimitado', 'Priority Support', 'Custom integrations'] }
]

export default function Plans() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [currentPlan, setCurrentPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const res = await api.get('/plans')
      setPlans(res.data)
      const current = res.data.find(p => p.is_current)
      if (current) setCurrentPlan(current)
    } catch (err) {
      setPlans(PLANS)
    }
  }

  const selectPlan = async (planId) => {
    setLoading(true)
    setSelectedPlan(planId)
    try {
      await api.post('/plans/select', { plan_id: planId })
      alert('Plan actualizado exitosamente')
      loadPlans()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cambiar plan')
    } finally {
      setLoading(false)
      setSelectedPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="text-slate-600 hover:text-slate-900 flex items-center gap-2">
            ← Volver
          </button>
          <h1 className="text-xl font-bold text-slate-800">Planes</h1>
          <div className="w-20"></div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Elige tu Plan</h2>
          <p className="text-slate-600">Selecciona el plan que mejor se adapte a tus necesidades</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {PLANS.map(plan => (
            <div key={plan.id} className={`bg-white rounded-xl p-6 border-2 ${currentPlan?.id === plan.id ? 'border-brand-500 ring-2 ring-brand-100' : 'border-slate-200'}`}>
              {currentPlan?.id === plan.id && (
                <div className="bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                  PLAN ACTUAL
                </div>
              )}
              <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-slate-900">${plan.price}</span>
                <span className="text-slate-500">/mes</span>
              </div>
              <div className="text-slate-600 text-sm mb-4">
                {plan.messages === -1 ? 'Ilimitados' : plan.messages} mensajes/mes
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-center gap-2">
                    <span className="text-brand-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              {currentPlan?.id !== plan.id && (
                <button
                  onClick={() => selectPlan(plan.id)}
                  disabled={loading && selectedPlan === plan.id}
                  className="w-full py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
                >
                  {loading && selectedPlan === plan.id ? 'Cambiando...' : 'Seleccionar'}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-slate-100 rounded-xl p-6 text-center">
          <h3 className="font-bold text-slate-900 mb-2">¿Necesitas algo diferente?</h3>
          <p className="text-slate-600 mb-4">Contáctanos para crear un plan personalizado para tu negocio</p>
          <a href="https://wa.me/584123821754?text=Hola,%20me%20interesa%20un%20plan%20personalizado" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700">
            Contactar Ventas
          </a>
        </div>
      </div>
    </div>
  )
}
