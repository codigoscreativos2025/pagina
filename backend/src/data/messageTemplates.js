// Pre-built WhatsApp message templates by industry
// These are ready-to-use templates that match Meta's WhatsApp Business API format

export const industryMessageTemplates = {
  restaurant: [
    {
      id: 'rest_welcome',
      name: 'Bienvenida restaurante',
      display_name: '🍽️ Bienvenida',
      category: 'UTILITY',
      language: 'es',
      body_text: '¡Hola {{1}}! Bienvenido a {{2}}. 🍽️\n\n¿En qué podemos ayudarte hoy?\n\n📋 Ver menú\n📅 Hacer reservación\n❓ Información general',
      variables_count: 2,
      suggested_use: 'Primer mensaje cuando un cliente contacta por primera vez',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Ver menú' },
        { type: 'QUICK_REPLY', text: 'Reservar mesa' },
        { type: 'QUICK_REPLY', text: 'Horarios' }
      ]
    },
    {
      id: 'rest_reservation_confirm',
      name: 'Confirmar reservacion',
      display_name: '✅ Confirmar reserva',
      category: 'UTILITY',
      language: 'es',
      body_text: '¡Perfecto {{1}}! Tu reservación ha sido confirmada:\n\n📅 Fecha: {{2}}\n⏰ Hora: {{3}}\n👥 Personas: {{4}}\n\n¿Necesitas algo más?',
      variables_count: 4,
      suggested_use: 'Confirmar detalles de una reservación',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Modificar' },
        { type: 'QUICK_REPLY', text: 'Cancelar' }
      ]
    },
    {
      id: 'rest_menu',
      name: 'Enviar menu',
      display_name: '📋 Enviar menú',
      category: 'UTILITY',
      language: 'es',
      body_text: 'Aquí tienes nuestro menú completo, {{1}}:\n\n🥗 Entradas: desde ${{2}}\n🍽️ Platos fuertes: desde ${{3}}\n🍰 Postres: desde ${{4}}\n🍹 Bebidas: desde ${{5}}\n\n¿Te gustaría hacer una reservación?',
      variables_count: 5,
      suggested_use: 'Enviar información del menú con precios',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Reservar' },
        { type: 'QUICK_REPLY', text: 'Más info' }
      ]
    },
    {
      id: 'rest_hours',
      name: 'Horarios atencion',
      display_name: '⏰ Horarios',
      category: 'UTILITY',
      language: 'es',
      body_text: 'Nuestros horarios de atención, {{1}}:\n\n📅 Lunes a Viernes: {{2}} - {{3}}\n📅 Sábados: {{4}} - {{5}}\n📅 Domingos: {{6}}\n\n¡Te esperamos!',
      variables_count: 6,
      suggested_use: 'Responder consulta de horarios',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Reservar' },
        { type: 'QUICK_REPLY', text: 'Ubicación' }
      ]
    },
    {
      id: 'rest_followup',
      name: 'Seguimiento post visita',
      display_name: '⭐ Seguimiento',
      category: 'MARKETING',
      language: 'es',
      body_text: '¡Hola {{1}}! Esperamos que hayas disfrutado tu visita a {{2}}. 🌟\n\n¿Nos dejarías tu opinión? Tu feedback nos ayuda a mejorar.\n\n¡Gracias por elegirnos!',
      variables_count: 2,
      suggested_use: 'Seguimiento 24h después de la visita',
      buttons: [
        { type: 'QUICK_REPLY', text: '⭐⭐⭐⭐⭐' },
        { type: 'QUICK_REPLY', text: 'Dejar reseña' }
      ]
    }
  ],

  ecommerce: [
    {
      id: 'ecom_welcome',
      name: 'Bienvenida tienda',
      display_name: '🛒 Bienvenida',
      category: 'UTILITY',
      language: 'es',
      body_text: '¡Hola {{1}}! Bienvenido a {{2}}. 🛍️\n\n¿En qué podemos ayudarte?\n\n📦 Ver productos\n🚚 Estado de pedido\n↩️ Devoluciones',
      variables_count: 2,
      suggested_use: 'Primer contacto con cliente nuevo',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Ver catálogo' },
        { type: 'QUICK_REPLY', text: 'Mi pedido' },
        { type: 'QUICK_REPLY', text: 'Ayuda' }
      ]
    },
    {
      id: 'ecom_order_confirm',
      name: 'Confirmar pedido',
      display_name: '✅ Pedido confirmado',
      category: 'UTILITY',
      language: 'es',
      body_text: '¡Tu pedido #{{1}} ha sido confirmado! 🎉\n\n📦 Productos: {{2}}\n💰 Total: ${{3}}\n🚚 Envío estimado: {{4}} días hábiles\n\nTe enviaremos tu número de seguimiento cuando se envíe.',
      variables_count: 4,
      suggested_use: 'Confirmar compra realizada',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Rastrear' },
        { type: 'QUICK_REPLY', text: 'Más compras' }
      ]
    },
    {
      id: 'ecom_shipping',
      name: 'Info envio',
      display_name: '🚚 Info de envío',
      category: 'UTILITY',
      language: 'es',
      body_text: 'Hola {{1}}, tu pedido #{{2}} está en camino! 🚚\n\n📍 Guía de rastreo: {{3}}\n📅 Llegada estimada: {{4}}\n\n¿Necesitas algo más?',
      variables_count: 4,
      suggested_use: 'Informar estado de envío',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Rastrear' },
        { type: 'QUICK_REPLY', text: 'Soporte' }
      ]
    },
    {
      id: 'ecom_abandoned_cart',
      name: 'Carrito abandonado',
      display_name: '🛒 Recordatorio carrito',
      category: 'MARKETING',
      language: 'es',
      body_text: '¡Hola {{1}}! Notamos que dejaste productos en tu carrito 🛒\n\nTodavía los tienes reservados por {{2}} horas más.\n\n¿Quieres completar tu compra? ¡Tenemos un {{3}}% de descuento para ti! Usa el código: {{4}}',
      variables_count: 4,
      suggested_use: 'Recuperar carrito abandonado (24h después)',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Comprar ahora' },
        { type: 'QUICK_REPLY', text: 'Ver carrito' }
      ]
    },
    {
      id: 'ecom_return',
      name: 'Politica devoluciones',
      display_name: '↩️ Devoluciones',
      category: 'UTILITY',
      language: 'es',
      body_text: 'Hola {{1}}, nuestra política de devoluciones:\n\n✅ Tienes {{2}} días para devolver\n📦 Producto sin usar y con etiqueta\n💰 Reembolso en {{3}} días hábiles\n\n¿Quieres iniciar una devolución?',
      variables_count: 3,
      suggested_use: 'Responder consulta sobre devoluciones',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Iniciar devolución' },
        { type: 'QUICK_REPLY', text: 'Hablar con humano' }
      ]
    }
  ],

  professional: [
    {
      id: 'prof_welcome',
      name: 'Bienvenida profesional',
      display_name: '💼 Bienvenida',
      category: 'UTILITY',
      language: 'es',
      body_text: '¡Hola {{1}}! Gracias por contactar a {{2}}. 💼\n\n¿En qué podemos ayudarte?\n\n📅 Agendar consulta\n💰 Solicitar cotización\n❓ Información de servicios',
      variables_count: 2,
      suggested_use: 'Primer contacto con cliente potencial',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Agendar cita' },
        { type: 'QUICK_REPLY', text: 'Cotización' },
        { type: 'QUICK_REPLY', text: 'Servicios' }
      ]
    },
    {
      id: 'prof_appointment_confirm',
      name: 'Confirmar cita',
      display_name: '✅ Cita confirmada',
      category: 'UTILITY',
      language: 'es',
      body_text: 'Tu cita ha sido agendada, {{1}}:\n\n📅 Fecha: {{2}}\n⏰ Hora: {{3}}\n📍 Lugar: {{4}}\n⏱️ Duración: {{5}} minutos\n\n¿Necesitas preparar algo para la consulta?',
      variables_count: 5,
      suggested_use: 'Confirmar cita agendada',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Reprogramar' },
        { type: 'QUICK_REPLY', text: 'Cancelar' }
      ]
    },
    {
      id: 'prof_proposal',
      name: 'Enviar propuesta',
      display_name: '📄 Propuesta enviada',
      category: 'UTILITY',
      language: 'es',
      body_text: 'Hola {{1}}, tu propuesta/cotización está lista:\n\n📋 Servicio: {{2}}\n💰 Inversión: ${{3}}\n⏱️ Tiempo de entrega: {{4}}\n\nLa propuesta detallada se envió a tu email. ¿Tienes alguna pregunta?',
      variables_count: 4,
      suggested_use: 'Notificar que una propuesta está lista',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Acepto' },
        { type: 'QUICK_REPLY', text: 'Negociar' },
        { type: 'QUICK_REPLY', text: 'Preguntas' }
      ]
    },
    {
      id: 'prof_followup',
      name: 'Seguimiento propuesta',
      display_name: '📞 Seguimiento',
      category: 'MARKETING',
      language: 'es',
      body_text: 'Hola {{1}}, ¿tuviste oportunidad de revisar la propuesta que te enviamos? 📋\n\nEstamos disponibles para resolver cualquier duda.\n\n¡Esperamos trabajar contigo!',
      variables_count: 1,
      suggested_use: 'Seguimiento 48h después de enviar propuesta',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Sí, acepto' },
        { type: 'QUICK_REPLY', text: 'Tengo dudas' },
        { type: 'QUICK_REPLY', text: 'No por ahora' }
      ]
    }
  ],

  clinic: [
    {
      id: 'clinic_welcome',
      name: 'Bienvenida clinica',
      display_name: '🏥 Bienvenida',
      category: 'UTILITY',
      language: 'es',
      body_text: '¡Hola {{1}}! Bienvenido a {{2}}. 🏥\n\n¿Cómo podemos ayudarte?\n\n📅 Agendar cita\n🩺 Especialidades\n📋 Información de consultas',
      variables_count: 2,
      suggested_use: 'Primer contacto con paciente',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Agendar cita' },
        { type: 'QUICK_REPLY', text: 'Especialidades' },
        { type: 'QUICK_REPLY', text: 'Urgencias' }
      ]
    },
    {
      id: 'clinic_appointment',
      name: 'Confirmar cita medica',
      display_name: '✅ Cita médica confirmada',
      category: 'UTILITY',
      language: 'es',
      body_text: 'Tu cita médica ha sido confirmada, {{1}}:\n\n👨‍⚕️ Doctor: {{2}}\n🩺 Especialidad: {{3}}\n📅 Fecha: {{4}}\n⏰ Hora: {{5}}\n\n⚠️ Recuerda llegar 15 minutos antes.',
      variables_count: 5,
      suggested_use: 'Confirmar cita médica',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Confirmar' },
        { type: 'QUICK_REPLY', text: 'Reprogramar' },
        { type: 'QUICK_REPLY', text: 'Cancelar' }
      ]
    },
    {
      id: 'clinic_reminder',
      name: 'Recordatorio cita',
      display_name: '⏰ Recordatorio',
      category: 'UTILITY',
      language: 'es',
      body_text: 'Recordatorio: Tienes cita mañana en {{1}}:\n\n📅 {{2}} a las {{3}}\n👨‍⚕️ Dr. {{4}}\n\n¿Confirmas tu asistencia?',
      variables_count: 4,
      suggested_use: 'Recordatorio 24h antes de la cita',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Sí, confirmo' },
        { type: 'QUICK_REPLY', text: 'No puedo ir' }
      ]
    },
    {
      id: 'clinic_results',
      name: 'Resultados listos',
      display_name: '📋 Resultados listos',
      category: 'UTILITY',
      language: 'es',
      body_text: 'Hola {{1}}, tus resultados están listos. 📋\n\n🩺 Estudio: {{2}}\n📅 Fecha: {{3}}\n\nPuedes pasar a recogerlos o te los enviamos por email.',
      variables_count: 3,
      suggested_use: 'Notificar resultados de estudios',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Recoger en clínica' },
        { type: 'QUICK_REPLY', text: 'Enviar por email' }
      ]
    }
  ],

  education: [
    {
      id: 'edu_welcome',
      name: 'Bienvenida educacion',
      display_name: '📚 Bienvenida',
      category: 'UTILITY',
      language: 'es',
      body_text: '¡Hola {{1}}! Bienvenido a {{2}}. 📚\n\n¿Qué te interesa?\n\n📖 Cursos disponibles\n💰 Precios y planes\n📅 Próximo inicio de clases',
      variables_count: 2,
      suggested_use: 'Primer contacto con estudiante potencial',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Ver cursos' },
        { type: 'QUICK_REPLY', text: 'Precios' },
        { type: 'QUICK_REPLY', text: 'Inscribirme' }
      ]
    },
    {
      id: 'edu_course_info',
      name: 'Info curso',
      display_name: '📖 Info del curso',
      category: 'UTILITY',
      language: 'es',
      body_text: 'Curso: {{1}}\n\n⏱️ Duración: {{2}} semanas\n📅 Inicio: {{3}}\n💰 Precio: ${{4}}\n🎓 Certificado: {{5}}\n\n¿Quieres inscribirte?',
      variables_count: 5,
      suggested_use: 'Enviar información detallada de un curso',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Inscribirme' },
        { type: 'QUICK_REPLY', text: 'Más cursos' }
      ]
    },
    {
      id: 'edu_enrollment',
      name: 'Inscripcion confirmada',
      display_name: '✅ Inscripción confirmada',
      category: 'UTILITY',
      language: 'es',
      body_text: '¡Felicidades {{1}}! Tu inscripción está confirmada. 🎉\n\n📚 Curso: {{2}}\n📅 Inicio: {{3}}\n💳 Pago: ${{4}}\n\nRecibirás los accesos por email. ¡Nos vemos en clase!',
      variables_count: 4,
      suggested_use: 'Confirmar inscripción de estudiante',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Ver materiales' },
        { type: 'QUICK_REPLY', text: 'Contactar profesor' }
      ]
    },
    {
      id: 'edu_reminder',
      name: 'Recordatorio clase',
      display_name: '⏰ Recordatorio de clase',
      category: 'UTILITY',
      language: 'es',
      body_text: '¡Hola {{1}}! Recordatorio: tienes clase mañana 📚\n\n📖 Curso: {{2}}\n⏰ Hora: {{3}}\n📍 {{4}}\n\n¡No faltes!',
      variables_count: 4,
      suggested_use: 'Recordatorio antes de inicio de clase',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Confirmo asistencia' },
        { type: 'QUICK_REPLY', text: 'No podré ir' }
      ]
    }
  ]
}

// Helper functions
export function getTemplatesByIndustry(industry) {
  return industryMessageTemplates[industry] || []
}

export function getAllMessageTemplates() {
  return Object.values(industryMessageTemplates).flat()
}

export function searchTemplates(query, industry = null) {
  const templates = industry 
    ? (industryMessageTemplates[industry] || [])
    : getAllMessageTemplates()
  
  const lowerQuery = query.toLowerCase()
  return templates.filter(t => 
    t.display_name.toLowerCase().includes(lowerQuery) ||
    t.body_text.toLowerCase().includes(lowerQuery) ||
    t.suggested_use.toLowerCase().includes(lowerQuery) ||
    t.category.toLowerCase().includes(lowerQuery)
  )
}

export function convertToMetaFormat(template) {
  // Convert our simplified format to Meta WhatsApp API format
  const components = [
    {
      type: 'BODY',
      text: template.body_text
    }
  ]

  // Add buttons if they exist
  if (template.buttons && template.buttons.length > 0) {
    const quickReplies = template.buttons
      .filter(b => b.type === 'QUICK_REPLY')
      .map(b => ({
        type: 'BUTTON',
        sub_type: 'QUICK_REPLY',
        index: template.buttons.indexOf(b),
        parameters: [{ type: 'text', text: b.text }]
      }))

    if (quickReplies.length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons: template.buttons.map((b, i) => ({
          type: 'QUICK_REPLY',
          text: b.text
        }))
      })
    }
  }

  return {
    name: template.name,
    category: template.category,
    language: template.language,
    components
  }
}
