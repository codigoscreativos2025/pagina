import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const RECIPE_ICONS = {
  welcome_message: '👋',
  followup_24h: '⏰',
  price_keyword: '💰',
  after_hours: '🌙',
  lead_qualify: '🎯'
}

const RECIPE_DESCRIPTIONS = {
  welcome_message: 'Cuando llega un lead nuevo, enviar mensaje de bienvenida automático',
  followup_24h: 'Si un lead no responde en 24h, enviar seguimiento',
  price_keyword: 'Si el lead menciona "precio" o "costo", enviar información',
  after_hours: 'Fuera de horario, responder con mensaje de "volveremos pronto"',
  lead_qualify: 'Hacer 3 preguntas para calificar al lead automáticamente'
}

export default function Recipes() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [recipes, setRecipes] = useState([])
  const [activeRecipes, setActiveRecipes] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    loadRecipes()
  }, [])

  const loadRecipes = async () => {
    try {
      const [recipesRes, activeRes] = await Promise.all([
        api.get('/automations/recipes').catch(() => ({ data: { recipes: [] } })),
        api.get('/automations/active').catch(() => ({ data: { active: [] } }))
      ])
      setRecipes(recipesRes.data.recipes || [])
      setActiveRecipes(new Set(activeRes.data.active || []))
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const toggleRecipe = async (id) => {
    setSaving(id)
    try {
      if (activeRecipes.has(id)) {
        await api.post(`/automations/recipes/${id}/deactivate`)
        setActiveRecipes(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      } else {
        await api.post(`/automations/recipes/${id}/activate`)
        setActiveRecipes(prev => new Set([...prev, id]))
      }
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message))
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando recetas...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="text-slate-600 hover:text-slate-900 flex items-center gap-2">← Dashboard</button>
          <h1 className="text-xl font-bold text-slate-800">🍳 Recetas de Automatización</h1>
          <div className="w-20"></div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Automatizaciones listas para usar</h1>
          <p className="text-slate-500 text-sm">Activa las que necesites. Tu agente las ejecutará automáticamente.</p>
        </div>

        <div className="space-y-4">
          {recipes.map(recipe => {
            const isActive = activeRecipes.has(recipe.id)
            const isSaving = saving === recipe.id
            return (
              <div key={recipe.id} className={`bg-white rounded-xl border-2 p-5 transition-all ${
                isActive ? 'border-brand-300 bg-brand-50/30' : 'border-slate-200'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{RECIPE_ICONS[recipe.id] || '⚡'}</div>
                    <div>
                      <h3 className="font-bold text-slate-900">{recipe.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">{RECIPE_DESCRIPTIONS[recipe.id] || recipe.description}</p>
                      {recipe.trigger && (
                        <div className="mt-2 text-xs text-slate-400">
                          <span className="font-medium">Trigger:</span> {recipe.trigger}
                          {recipe.keywords && <span className="ml-2"><span className="font-medium">Palabras:</span> {recipe.keywords.join(', ')}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleRecipe(recipe.id)}
                    disabled={isSaving}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      isActive ? 'bg-brand-600' : 'bg-slate-300'
                    } disabled:opacity-50`}
                  >
                    <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                      isActive ? 'translate-x-7' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            )
          })}
          {recipes.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              No hay recetas disponibles. Vuelve más tarde.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
