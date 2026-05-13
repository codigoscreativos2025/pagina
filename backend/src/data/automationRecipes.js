// Automatizaciones "Recetas" pre-construidas
const automationRecipes = [
  {
    id: 'welcome_message',
    name: 'Mensaje de bienvenida automático',
    description: 'Cuando llega un lead nuevo, enviar mensaje de bienvenida',
    trigger: 'lead_created',
    action: 'send_message',
    template: '¡Hola {{nombre}}! Gracias por contactarnos. ¿En qué podemos ayudarte?',
    enabled: true
  },
  {
    id: 'followup_24h',
    name: 'Seguimiento a 24 horas',
    description: 'Si un lead no responde en 24h, enviar seguimiento',
    trigger: 'no_response_24h',
    action: 'send_message',
    template: 'Hola {{nombre}}, ¿tuviste oportunidad de ver mi mensaje anterior? Estamos aquí para ayudarte.',
    enabled: true
  },
  {
    id: 'price_keyword',
    name: 'Respuesta automática a "precio"',
    description: 'Si el lead menciona precio o costo, enviar información',
    trigger: 'keyword_match',
    keywords: ['precio', 'costo', 'cuánto', 'cuanto', 'tarifa', 'valor'],
    action: 'send_message',
    template: 'Te comparto nuestra información de precios. ¿Te gustaría agendar una consulta para más detalles?',
    enabled: true
  },
  {
    id: 'after_hours',
    name: 'Mensaje fuera de horario',
    description: 'Fuera de horario laboral, responder que volveremos pronto',
    trigger: 'after_hours',
    action: 'send_message',
    template: '¡Hola! En este momento estamos fuera de horario. Te responderemos mañana a primera hora. ¡Gracias por tu paciencia!',
    schedule: { start: '18:00', end: '09:00', timezone: 'America/Bogota' },
    enabled: true
  },
  {
    id: 'lead_qualify',
    name: 'Calificación automática de leads',
    description: 'Hacer preguntas para calificar al lead automáticamente',
    trigger: 'lead_created',
    action: 'ask_questions',
    questions: [
      '¿Qué producto o servicio te interesa?',
      '¿Para cuándo lo necesitas?',
      '¿Cuál es tu presupuesto aproximado?'
    ],
    enabled: true
  }
]

function getAllRecipes() {
  return automationRecipes
}

function getRecipeById(id) {
  return automationRecipes.find(r => r.id === id) || null
}

module.exports = {
  automationRecipes,
  getAllRecipes,
  getRecipeById
}
