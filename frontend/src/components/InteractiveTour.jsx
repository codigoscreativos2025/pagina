import { useState, useEffect } from 'react'

// Tour steps for different pages
export const TOUR_STEPS = {
  dashboard: [
    {
      target: 'nav-agents',
      title: 'Tus Agentes IA',
      content: 'Aquí ves todos tus agentes de IA. Cada agente puede atender un canal diferente (WhatsApp, Facebook, TikTok).',
      placement: 'bottom'
    },
    {
      target: 'btn-create-agent',
      title: 'Crear Nuevo Agente',
      content: 'Haz clic aquí para crear un nuevo agente. Puedes usar una plantilla pre-configurada según tu tipo de negocio.',
      placement: 'bottom'
    },
    {
      target: 'nav-results',
      title: 'Ver Resultados',
      content: 'Aquí puedes ver los resultados de tu agente: conversaciones atendidas, leads generados y tiempo ahorrado.',
      placement: 'bottom'
    },
    {
      target: 'nav-crm',
      title: 'CRM / Chats',
      content: 'Gestiona todas tus conversaciones desde aquí. Puedes cambiar entre modo simple y avanzado.',
      placement: 'bottom'
    }
  ],
  crm: [
    {
      target: 'crm-simple-toggle',
      title: 'Modo Simple vs Avanzado',
      content: 'Alterna entre vista simple (solo conversaciones) y avanzada (tags, funnels, métricas).',
      placement: 'bottom'
    },
    {
      target: 'crm-lead-list',
      title: 'Lista de Leads',
      content: 'Aquí ves todas tus conversaciones activas. Haz clic en una para ver el chat completo.',
      placement: 'right'
    },
    {
      target: 'crm-chat-area',
      title: 'Área de Chat',
      content: 'Aquí puedes ver y responder mensajes. La IA puede responder automáticamente si está activada.',
      placement: 'left'
    },
    {
      target: 'crm-ai-toggle',
      title: 'Activar/Desactivar IA',
      content: 'Controla si la IA responde automáticamente a este lead. Cuando está activa, el agente responde solo.',
      placement: 'top'
    },
    {
      target: 'crm-template-btn',
      title: 'Enviar Plantilla',
      content: 'Envía mensajes pre-escritos personalizados. Perfecto para respuestas rápidas y consistentes.',
      placement: 'top'
    }
  ],
  integrations: [
    {
      target: 'integration-whatsapp',
      title: 'Conectar WhatsApp',
      content: 'Conecta tu número de WhatsApp Business para que tu agente pueda recibir y enviar mensajes.',
      placement: 'bottom'
    },
    {
      target: 'integration-facebook',
      title: 'Conectar Facebook',
      content: 'Conecta tu página de Facebook para atender mensajes de Messenger e Instagram desde un solo lugar.',
      placement: 'bottom'
    },
    {
      target: 'integration-tiktok',
      title: 'Conectar TikTok',
      content: 'Conecta tu cuenta de TikTok para responder comentarios y mensajes directos automáticamente.',
      placement: 'bottom'
    }
  ],
  templates: [
    {
      target: 'template-list',
      title: 'Plantillas de Mensajes',
      content: 'Aquí gestionas tus plantillas de WhatsApp. Las plantillas deben ser aprobadas por Meta antes de usarse.',
      placement: 'bottom'
    },
    {
      target: 'btn-new-template',
      title: 'Crear Plantilla',
      content: 'Crea una nueva plantilla con variables dinámicas como {{1}}, {{2}} para personalizar mensajes.',
      placement: 'bottom'
    }
  ]
}

export default function InteractiveTour({ page, onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  
  const steps = TOUR_STEPS[page] || []
  
  useEffect(() => {
    // Check if user has completed tour for this page
    const tourCompleted = localStorage.getItem(`pivot_tour_${page}`)
    if (!tourCompleted && steps.length > 0) {
      // Small delay to let page render
      setTimeout(() => setIsVisible(true), 500)
    }
  }, [page, steps.length])
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      highlightElement(steps[currentStep + 1].target)
    } else {
      completeTour()
    }
  }
  
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      highlightElement(steps[currentStep - 1].target)
    }
  }
  
  const handleSkip = () => {
    setIsVisible(false)
    localStorage.setItem(`pivot_tour_${page}`, 'true')
    onSkip?.()
  }
  
  const completeTour = () => {
    setIsVisible(false)
    localStorage.setItem(`pivot_tour_${page}`, 'true')
    onComplete?.()
  }
  
  const highlightElement = (targetId) => {
    // Remove previous highlights
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight', 'ring-4', 'ring-brand-500', 'ring-opacity-50', 'z-50')
    })
    
    // Highlight current element
    const el = document.getElementById(targetId)
    if (el) {
      el.classList.add('tour-highlight', 'ring-4', 'ring-brand-500', 'ring-opacity-50', 'z-50')
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
  
  useEffect(() => {
    if (isVisible && steps[currentStep]) {
      highlightElement(steps[currentStep].target)
    }
    
    return () => {
      document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight', 'ring-4', 'ring-brand-500', 'ring-opacity-50', 'z-50')
      })
    }
  }, [currentStep, isVisible, steps])
  
  if (!isVisible || steps.length === 0) return null
  
  const step = steps[currentStep]
  
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 pointer-events-auto"
        onClick={handleSkip}
      />
      
      {/* Tour Card */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 pointer-events-auto">
        {/* Progress Bar */}
        <div className="flex gap-1 mb-4">
          {steps.map((_, i) => (
            <div 
              key={i}
              className={`h-1 flex-1 rounded ${i <= currentStep ? 'bg-brand-600' : 'bg-gray-200'}`}
            />
          ))}
        </div>
        
        {/* Step Counter */}
        <div className="text-xs text-gray-500 mb-2">
          Paso {currentStep + 1} de {steps.length}
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          {step.title}
        </h3>
        
        {/* Content */}
        <p className="text-sm text-gray-600 mb-6">
          {step.content}
        </p>
        
        {/* Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Omitir tour
          </button>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Anterior
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700"
            >
              {currentStep < steps.length - 1 ? 'Siguiente' : 'Entendido ✓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
