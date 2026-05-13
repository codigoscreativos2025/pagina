import { useState } from 'react'

// Help content for different pages
export const HELP_CONTENT = {
  dashboard: {
    title: 'Dashboard',
    description: 'El Dashboard es tu centro de control. Aquí puedes ver un resumen de todos tus agentes y su rendimiento.',
    sections: [
      {
        title: '¿Qué es un Agente IA?',
        content: 'Un Agente IA es un asistente virtual configurado para atender a tus clientes automáticamente. Cada agente puede conectarse a un canal diferente (WhatsApp, Facebook, TikTok) y responder mensajes según las reglas que definas.'
      },
      {
        title: '¿Cómo creo mi primer agente?',
        content: 'Haz clic en "Crear Agente" y sigue el wizard. Puedes elegir una plantilla pre-configurada según tu tipo de negocio (restaurante, tienda online, servicios profesionales, etc.)'
      },
      {
        title: '¿Qué significan los números?',
        content: '• **Conversaciones**: Total de conversaciones atendidas por tu agente\n• **Leads**: Contactos nuevos que tu agente ha capturado\n• **Tiempo ahorrado**: Horas estimadas que tu agente te ha ahorrado'
      }
    ],
    videoUrl: null
  },
  crm: {
    title: 'CRM - Gestión de Conversaciones',
    description: 'El CRM te permite ver y gestionar todas las conversaciones de tus agentes.',
    sections: [
      {
        title: 'Modo Simple vs Avanzado',
        content: '• **Modo Simple**: Muestra solo la lista de conversaciones y el chat. Ideal para empezar.\n• **Modo Avanzado**: Muestra filtros por etapa, kanban, tags, variables y más herramientas de gestión.'
      },
      {
        title: '¿Cómo funciona la IA?',
        content: 'Cada lead tiene un toggle de IA. Cuando está activo (ON), el agente responde automáticamente usando el system prompt configurado. Cuando está desactivado (OFF), tú respondes manualmente.'
      },
      {
        title: 'Etapas del Funnel',
        content: 'Los leads se mueven por etapas como: Nuevo → En conversación → Convertido → Perdido. Puedes mover leads manualmente o dejar que la IA lo sugiera.'
      },
      {
        title: 'Enviar Plantillas',
        content: 'Haz clic en el ícono 📋 para ver plantillas pre-escritas. Selecciona una, personaliza las variables y envíala.'
      }
    ],
    videoUrl: null
  },
  integrations: {
    title: 'Integraciones',
    description: 'Conecta tus canales de comunicación para que tu agente pueda atender clientes.',
    sections: [
      {
        title: 'WhatsApp Business API',
        content: 'Necesitas una cuenta de Meta Developer y un número de WhatsApp Business. Sigue estos pasos:\n1. Ve a developers.facebook.com\n2. Crea una app de tipo "Business"\n3. Obtén tu Phone Number ID y Access Token\n4. Pégalos aquí y haz clic en "Conectar"'
      },
      {
        title: 'Facebook / Instagram',
        content: 'Conecta tu página de Facebook con un clic usando OAuth. Esto también te permite atender mensajes de Instagram si están vinculados.'
      },
      {
        title: 'TikTok',
        content: 'Necesitas una cuenta en TikTok Developer Portal. El proceso es similar a Meta pero requiere aprobación adicional.'
      }
    ],
    videoUrl: null
  },
  templates: {
    title: 'Plantillas de WhatsApp',
    description: 'Las plantillas te permiten enviar mensajes proactivos a tus clientes.',
    sections: [
      {
        title: '¿Qué son las plantillas?',
        content: 'Son mensajes pre-aprobados por Meta que puedes enviar a clientes fuera de la ventana de 24 horas. Deben seguir las políticas de WhatsApp.'
      },
      {
        title: '¿Cómo creo una plantilla?',
        content: '1. Haz clic en "Nueva Plantilla"\n2. Elige un nombre (solo minúsculas y guiones)\n3. Escribe el mensaje usando {{1}}, {{2}} para variables\n4. Envía a Meta para aprobación\n5. Una vez aprobada, podrás usarla desde el CRM'
      },
      {
        title: 'Estados de plantilla',
        content: '• **DRAFT**: Borrador, aún no enviada a Meta\n• **PENDING**: Enviada, esperando aprobación\n• **APPROVED**: Lista para usar\n• **REJECTED**: Rechazada, revisa la razón'
      }
    ],
    videoUrl: null
  },
  automations: {
    title: 'Automatizaciones',
    description: 'Crea flujos automáticos para responder a eventos sin intervención manual.',
    sections: [
      {
        title: '¿Qué es una automatización?',
        content: 'Una regla que dice "cuando pase X, haz Y". Por ejemplo: "Cuando llegue un lead nuevo, enviar mensaje de bienvenida".'
      },
      {
        title: 'Recetas pre-hechas',
        content: 'Tenemos recetas listas para usar:\n• Mensaje de bienvenida automático\n• Seguimiento a las 24h\n• Respuesta automática a "precio"\n• Mensaje fuera de horario\n• Calificación de leads'
      }
    ],
    videoUrl: null
  },
  results: {
    title: 'Resultados',
    description: 'Ve los resultados concretos de tu agente IA.',
    sections: [
      {
        title: 'Conversaciones Atendidas',
        content: 'Número total de conversaciones que tu agente ha manejado esta semana.'
      },
      {
        title: 'Leads Generados',
        content: 'Contactos nuevos que tu agente ha capturado y agregado a tu CRM.'
      },
      {
        title: 'Tiempo Ahorrado',
        content: 'Estimación de horas que tu agente te ha ahorrado, basado en el promedio de 5 minutos por conversación manual.'
      },
      {
        title: 'Semáforo de Rendimiento',
        content: '🟢 Verde: Todo va bien, métricas subiendo\n🟡 Amarillo: Algo bajó, revisa las sugerencias\n🔴 Rojo: Atención necesaria, hay un problema'
      }
    ],
    videoUrl: null
  }
}

export default function ContextualHelp({ page }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState(null)
  
  const help = HELP_CONTENT[page]
  
  if (!help) return null
  
  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-brand-600 text-white rounded-full shadow-lg hover:bg-brand-700 flex items-center justify-center text-xl z-40"
        title="Ayuda"
      >
        ?
      </button>
      
      {/* Help Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{help.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{help.description}</p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {help.sections.map((section, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setActiveSection(activeSection === i ? null : i)}
                      className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-50"
                    >
                      <span className="font-semibold text-gray-800">{section.title}</span>
                      <span className="text-gray-400">{activeSection === i ? '−' : '+'}</span>
                    </button>
                    {activeSection === i && (
                      <div className="px-4 pb-4 text-sm text-gray-600 whitespace-pre-line">
                        {section.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Video placeholder */}
              {help.videoUrl && (
                <div className="mt-6 bg-gray-100 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">🎬</div>
                  <p className="text-sm text-gray-600">Video tutorial (próximamente)</p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                ¿Necesitas más ayuda? Contáctanos en <a href="mailto:soporte@pivot.ai" className="text-brand-600">soporte@pivot.ai</a>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
