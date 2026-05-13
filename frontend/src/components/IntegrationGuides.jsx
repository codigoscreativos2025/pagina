import { useState } from 'react'

export const INTEGRATION_GUIDES = {
  whatsapp: {
    name: 'WhatsApp Business API',
    icon: '📱',
    color: 'bg-green-50 border-green-200',
    steps: [
      {
        title: 'Crear cuenta Meta Developer',
        description: 'Ve a developers.facebook.com y crea una cuenta si no tienes una.',
        action: 'Ir a Meta Developers',
        url: 'https://developers.facebook.com'
      },
      {
        title: 'Crear una App de tipo Business',
        description: 'Haz clic en "My Apps" → "Create App" → Selecciona "Business" como tipo.',
        action: null,
        url: null
      },
      {
        title: 'Configurar WhatsApp API',
        description: 'En el dashboard de tu app, busca "WhatsApp" y haz clic en "Set Up".',
        action: null,
        url: null
      },
      {
        title: 'Obtener credenciales',
        description: 'Necesitas dos cosas:\n• **Phone Number ID**: Lo encuentras en WhatsApp → API Setup\n• **Access Token**: Lo encuentras en WhatsApp → API Setup → Temporary Access Token',
        action: null,
        url: null
      },
      {
        title: 'Conectar en Pivot.AI',
        description: 'Ve a Integraciones → WhatsApp y pega tus credenciales. Haz clic en "Conectar".',
        action: null,
        url: null
      },
      {
        title: 'Verificar conexión',
        description: 'Envía un mensaje de prueba a tu número. Deberías verlo en el CRM.',
        action: null,
        url: null
      }
    ],
    tips: [
      'El token temporal dura 24 horas. Para producción, genera un token permanente.',
      'Tu número debe ser WhatsApp Business, no WhatsApp personal.',
      'Puedes usar el número de prueba de Meta para testing.'
    ]
  },
  facebook: {
    name: 'Facebook Messenger',
    icon: '💬',
    color: 'bg-blue-50 border-blue-200',
    steps: [
      {
        title: 'Tener una Página de Facebook',
        description: 'Necesitas ser administrador de una Página de Facebook.',
        action: null,
        url: null
      },
      {
        title: 'Conectar con un clic',
        description: 'Ve a Integraciones → Facebook y haz clic en "Conectar con Facebook". Se abrirá una ventana de autorización.',
        action: null,
        url: null
      },
      {
        title: 'Autorizar permisos',
        description: 'Acepta los permisos para gestionar mensajes de tu página.',
        action: null,
        url: null
      },
      {
        title: 'Verificar conexión',
        description: 'Envía un mensaje a tu página. Deberías verlo en el CRM.',
        action: null,
        url: null
      }
    ],
    tips: [
      'La conexión con Facebook también habilita Instagram si están vinculados.',
      'Solo necesitas ser administrador de la página.'
    ]
  },
  instagram: {
    name: 'Instagram Direct',
    icon: '📸',
    color: 'bg-pink-50 border-pink-200',
    steps: [
      {
        title: 'Vincular Instagram a Facebook',
        description: 'Tu cuenta de Instagram debe estar vinculada a una Página de Facebook.',
        action: null,
        url: null
      },
      {
        title: 'Conectar vía Facebook',
        description: 'Al conectar Facebook, Instagram se conecta automáticamente si están vinculados.',
        action: null,
        url: null
      },
      {
        title: 'Verificar conexión',
        description: 'Envía un DM a tu cuenta de Instagram. Deberías verlo en el CRM.',
        action: null,
        url: null
      }
    ],
    tips: [
      'Instagram requiere que tengas una cuenta Business o Creator.',
      'La vinculación con Facebook se hace desde la app de Instagram.'
    ]
  },
  tiktok: {
    name: 'TikTok',
    icon: '🎵',
    color: 'bg-gray-50 border-gray-200',
    steps: [
      {
        title: 'Crear cuenta TikTok Developer',
        description: 'Ve a developers.tiktok.com y crea una cuenta.',
        action: 'Ir a TikTok Developers',
        url: 'https://developers.tiktok.com'
      },
      {
        title: 'Crear una App',
        description: 'Crea una nueva app y selecciona los scopes necesarios para mensajería.',
        action: null,
        url: null
      },
      {
        title: 'Obtener credenciales',
        description: 'Necesitas:\n• **Client Key**\n• **Client Secret**\n• **Access Token**',
        action: null,
        url: null
      },
      {
        title: 'Conectar en Pivot.AI',
        description: 'Ve a Integraciones → TikTok y pega tus credenciales.',
        action: null,
        url: null
      },
      {
        title: 'Verificar conexión',
        description: 'Envía un mensaje a tu cuenta de TikTok. Deberías verlo en el CRM.',
        action: null,
        url: null
      }
    ],
    tips: [
      'TikTok requiere aprobación adicional para acceso a mensajería.',
      'El proceso puede tardar varios días.'
    ]
  }
}

export default function IntegrationGuides({ channel }) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  
  const guide = INTEGRATION_GUIDES[channel]
  
  if (!guide) return null
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border ${guide.color} hover:opacity-80`}
      >
        {guide.icon} Guía de {guide.name}
      </button>
    )
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsOpen(false)}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b ${guide.color}`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{guide.icon}</span>
              <div>
                <h2 className="text-lg font-bold text-gray-800">{guide.name}</h2>
                <p className="text-xs text-gray-600">Paso {currentStep + 1} de {guide.steps.length}</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>
          
          {/* Progress */}
          <div className="flex gap-1 mt-3">
            {guide.steps.map((_, i) => (
              <div 
                key={i}
                className={`h-1 flex-1 rounded ${i <= currentStep ? 'bg-brand-600' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>
        
        {/* Step Content */}
        <div className="p-6">
          <h3 className="font-bold text-gray-800 mb-2">{guide.steps[currentStep].title}</h3>
          <p className="text-sm text-gray-600 whitespace-pre-line mb-4">
            {guide.steps[currentStep].description}
          </p>
          
          {guide.steps[currentStep].url && (
            <a 
              href={guide.steps[currentStep].url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 mb-4"
            >
              {guide.steps[currentStep].action} →
            </a>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
          
          <button
            onClick={() => {
              if (currentStep < guide.steps.length - 1) {
                setCurrentStep(currentStep + 1)
              } else {
                setIsOpen(false)
              }
            }}
            className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700"
          >
            {currentStep < guide.steps.length - 1 ? 'Siguiente →' : 'Entendido ✓'}
          </button>
        </div>
        
        {/* Tips */}
        {currentStep === guide.steps.length - 1 && (
          <div className="p-4 border-t border-gray-200 bg-yellow-50">
            <h4 className="text-sm font-bold text-gray-800 mb-2">💡 Tips:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              {guide.tips.map((tip, i) => (
                <li key={i}>• {tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
