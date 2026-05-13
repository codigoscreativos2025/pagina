// Templates de agentes pre-construidos por industria
// Cada template incluye: system prompt, funnel stages, integraciones sugeridas

const agentTemplates = {
  restaurant: {
    id: 'restaurant',
    name: 'Restaurante',
    icon: '🍽️',
    description: 'Atiende reservas, responde sobre menú, horarios y delivery',
    systemPrompt: `Eres el asistente virtual de un restaurante. Tu nombre es {{agent_name}}.

TUS RESPONSABILIDADES:
1. Saludar cordialmente a los clientes
2. Responder consultas sobre horarios de atención
3. Compartir información del menú y platos del día
4. Tomar reservas (nombre, fecha, hora, cantidad de personas)
5. Informar sobre servicio de delivery y zonas de cobertura
6. Manejar quejas o sugerencias con amabilidad

REGLAS:
- Sé amable y profesional
- Responde en español
- Si no sabes algo, ofrece contactar al gerente
- Nunca inventes precios o platos que no existen
- Siempre confirma los datos de la reserva antes de finalizar`,
    funnel: {
      name: 'Embudo Restaurante',
      stages: [
        { name: 'Consulta', color: 'bg-blue-100 text-blue-800', ai_enabled: true, order_index: 0 },
        { name: 'Reservación', color: 'bg-yellow-100 text-yellow-800', ai_enabled: true, order_index: 1 },
        { name: 'Confirmada', color: 'bg-purple-100 text-purple-800', ai_enabled: true, order_index: 2 },
        { name: 'Visitó', color: 'bg-green-100 text-green-800', ai_enabled: false, order_index: 3 },
        { name: 'No asistió', color: 'bg-red-100 text-red-800', ai_enabled: false, order_index: 4 }
      ]
    },
    suggestedIntegrations: ['whatsapp', 'instagram'],
    businessInfo: {
      industry: 'restaurant',
      fields: [
        { key: 'business_name', label: 'Nombre del restaurante', placeholder: 'Ej: La Casa del Sabor' },
        { key: 'address', label: 'Dirección', placeholder: 'Ej: Av. Principal 123, Ciudad' },
        { key: 'schedule', label: 'Horarios', placeholder: 'Ej: Lun-Vie 11:00-22:00, Sáb-Dom 12:00-23:00' },
        { key: 'phone', label: 'Teléfono', placeholder: 'Ej: +1 555 123 4567' },
        { key: 'menu_url', label: 'Link del menú', placeholder: 'Ej: https://tu-restaurante.com/menu' }
      ]
    }
  },

  ecommerce: {
    id: 'ecommerce',
    name: 'Tienda Online',
    icon: '🛒',
    description: 'Responde sobre productos, stock, envíos y devoluciones',
    systemPrompt: `Eres el asistente virtual de una tienda online. Tu nombre es {{agent_name}}.

TUS RESPONSABILIDADES:
1. Saludar y ofrecer ayuda para encontrar productos
2. Responder consultas sobre disponibilidad y stock
3. Informar sobre precios, promociones y descuentos
4. Explicar políticas de envío y tiempos de entrega
5. Guiar en el proceso de devolución o cambio
6. Ofrecer alternativas si un producto no está disponible

REGLAS:
- Sé entusiasta y servicial
- Responde en español
- Si no tienes información de un producto, ofrece buscarla
- Siempre ofrece alternativas cuando algo no está disponible
- Menciona promociones activas cuando sea relevante`,
    funnel: {
      name: 'Embudo Ventas',
      stages: [
        { name: 'Interesado', color: 'bg-blue-100 text-blue-800', ai_enabled: true, order_index: 0 },
        { name: 'Consultando', color: 'bg-yellow-100 text-yellow-800', ai_enabled: true, order_index: 1 },
        { name: 'Carrito', color: 'bg-purple-100 text-purple-800', ai_enabled: true, order_index: 2 },
        { name: 'Compró', color: 'bg-green-100 text-green-800', ai_enabled: false, order_index: 3 },
        { name: 'Perdido', color: 'bg-red-100 text-red-800', ai_enabled: false, order_index: 4 }
      ]
    },
    suggestedIntegrations: ['whatsapp', 'facebook', 'instagram'],
    businessInfo: {
      industry: 'ecommerce',
      fields: [
        { key: 'business_name', label: 'Nombre de la tienda', placeholder: 'Ej: TechStore' },
        { key: 'website', label: 'Sitio web', placeholder: 'Ej: https://tu-tienda.com' },
        { key: 'shipping_info', label: 'Info de envíos', placeholder: 'Ej: Envío gratis en compras +$50. Entrega 2-5 días.' },
        { key: 'return_policy', label: 'Política de devoluciones', placeholder: 'Ej: 30 días para devoluciones sin costo.' }
      ]
    }
  },

  professional: {
    id: 'professional',
    name: 'Servicios Profesionales',
    icon: '💼',
    description: 'Agenda citas, responde FAQs sobre servicios y precios',
    systemPrompt: `Eres el asistente virtual de una empresa de servicios profesionales. Tu nombre es {{agent_name}}.

TUS RESPONSABILIDADES:
1. Saludar profesionalmente y presentarte
2. Informar sobre los servicios ofrecidos
3. Agendar citas y consultas (nombre, fecha, hora, servicio)
4. Responder preguntas frecuentes sobre precios y procesos
5. Recopilar información del cliente antes de la consulta
6. Enviar recordatorios de citas próximas

REGLAS:
- Mantén un tono profesional y respetuoso
- Responde en español
- Confirma siempre los datos de la cita
- Si la consulta requiere un especialista, ofrece transferir
- No des consejos legales, financieros o médicos específicos`,
    funnel: {
      name: 'Embudo Servicios',
      stages: [
        { name: 'Contacto inicial', color: 'bg-blue-100 text-blue-800', ai_enabled: true, order_index: 0 },
        { name: 'Consulta agendada', color: 'bg-yellow-100 text-yellow-800', ai_enabled: true, order_index: 1 },
        { name: 'Propuesta enviada', color: 'bg-purple-100 text-purple-800', ai_enabled: true, order_index: 2 },
        { name: 'Cliente', color: 'bg-green-100 text-green-800', ai_enabled: false, order_index: 3 },
        { name: 'No interesado', color: 'bg-red-100 text-red-800', ai_enabled: false, order_index: 4 }
      ]
    },
    suggestedIntegrations: ['whatsapp', 'google'],
    businessInfo: {
      industry: 'professional',
      fields: [
        { key: 'business_name', label: 'Nombre de la empresa', placeholder: 'Ej: Consultores Asociados' },
        { key: 'services', label: 'Servicios ofrecidos', placeholder: 'Ej: Consultoría legal, contabilidad, auditoría' },
        { key: 'schedule', label: 'Horarios de atención', placeholder: 'Ej: Lun-Vie 9:00-18:00' },
        { key: 'booking_link', label: 'Link para agendar', placeholder: 'Ej: https://calendly.com/tu-empresa' }
      ]
    }
  },

  clinic: {
    id: 'clinic',
    name: 'Clínica / Consultorio',
    icon: '🏥',
    description: 'Gestiona citas médicas, horarios y especialidades',
    systemPrompt: `Eres el asistente virtual de una clínica o consultorio médico. Tu nombre es {{agent_name}}.

TUS RESPONSABILIDADES:
1. Saludar con calidez y empatía
2. Informar sobre especialidades y doctores disponibles
3. Agendar citas médicas (nombre, especialidad, fecha, hora)
4. Informar sobre horarios y ubicación
5. Recordar requisitos para la cita (documentos, ayuno, etc.)
6. Manejar cancelaciones y reprogramaciones

REGLAS:
- Sé empático y profesional
- Responde en español
- NUNCA des diagnósticos o consejos médicos
- Siempre recomienda consultar con un profesional para temas de salud
- Confirma los datos de la cita antes de finalizar
- Maneja la información del cliente con confidencialidad`,
    funnel: {
      name: 'Embudo Clínica',
      stages: [
        { name: 'Solicitud', color: 'bg-blue-100 text-blue-800', ai_enabled: true, order_index: 0 },
        { name: 'Cita agendada', color: 'bg-yellow-100 text-yellow-800', ai_enabled: true, order_index: 1 },
        { name: 'Confirmada', color: 'bg-purple-100 text-purple-800', ai_enabled: true, order_index: 2 },
        { name: 'Atendido', color: 'bg-green-100 text-green-800', ai_enabled: false, order_index: 3 },
        { name: 'Cancelada', color: 'bg-red-100 text-red-800', ai_enabled: false, order_index: 4 }
      ]
    },
    suggestedIntegrations: ['whatsapp', 'google'],
    businessInfo: {
      industry: 'clinic',
      fields: [
        { key: 'business_name', label: 'Nombre de la clínica', placeholder: 'Ej: Centro Médico Salud' },
        { key: 'specialties', label: 'Especialidades', placeholder: 'Ej: Medicina general, cardiología, pediatría' },
        { key: 'schedule', label: 'Horarios', placeholder: 'Ej: Lun-Vie 7:00-20:00, Sáb 8:00-14:00' },
        { key: 'address', label: 'Dirección', placeholder: 'Ej: Calle Salud 456, Piso 2' }
      ]
    }
  },

  education: {
    id: 'education',
    name: 'Educación / Academia',
    icon: '📚',
    description: 'Informa sobre cursos, inscripciones y horarios de clases',
    systemPrompt: `Eres el asistente virtual de una academia o institución educativa. Tu nombre es {{agent_name}}.

TUS RESPONSABILIDADES:
1. Saludar con entusiasmo y motivación
2. Informar sobre cursos y programas disponibles
3. Explicar requisitos de inscripción
4. Informar sobre horarios, duración y costos
5. Guiar en el proceso de inscripción
6. Responder preguntas sobre metodología y certificaciones

REGLAS:
- Sé motivador y alentador
- Responde en español
- Destaca los beneficios de cada curso
- Si hay promociones o descuentos, menciónalos
- Ofrece agendar una llamada con un asesor si el interesado tiene muchas preguntas`,
    funnel: {
      name: 'Embudo Inscripciones',
      stages: [
        { name: 'Informado', color: 'bg-blue-100 text-blue-800', ai_enabled: true, order_index: 0 },
        { name: 'Interesado', color: 'bg-yellow-100 text-yellow-800', ai_enabled: true, order_index: 1 },
        { name: 'Inscripción', color: 'bg-purple-100 text-purple-800', ai_enabled: true, order_index: 2 },
        { name: 'Inscrito', color: 'bg-green-100 text-green-800', ai_enabled: false, order_index: 3 },
        { name: 'No inscrito', color: 'bg-red-100 text-red-800', ai_enabled: false, order_index: 4 }
      ]
    },
    suggestedIntegrations: ['whatsapp', 'instagram', 'facebook'],
    businessInfo: {
      industry: 'education',
      fields: [
        { key: 'business_name', label: 'Nombre de la academia', placeholder: 'Ej: Academia Innovate' },
        { key: 'courses', label: 'Cursos ofrecidos', placeholder: 'Ej: Inglés, programación, marketing digital' },
        { key: 'schedule', label: 'Horarios de clases', placeholder: 'Ej: Mañana 9-12, Tarde 2-5, Noche 6-9' },
        { key: 'enrollment_link', label: 'Link de inscripción', placeholder: 'Ej: https://tu-academia.com/inscripcion' }
      ]
    }
  }
}

// Función para obtener todos los templates
function getAllTemplates() {
  return Object.values(agentTemplates)
}

// Función para obtener un template por ID
function getTemplateById(id) {
  return agentTemplates[id] || null
}

// Función para generar system prompt con datos del negocio
function generateSystemPrompt(templateId, businessData, agentName) {
  const template = agentTemplates[templateId]
  if (!template) return null

  let prompt = template.systemPrompt
  prompt = prompt.replace(/\{\{agent_name\}\}/g, agentName || 'el asistente')

  // Agregar información del negocio al prompt
  if (businessData && Object.keys(businessData).length > 0) {
    prompt += '\n\nINFORMACIÓN DEL NEGOCIO:\n'
    Object.entries(businessData).forEach(([key, value]) => {
      if (value) {
        const label = template.businessInfo.fields.find(f => f.key === key)?.label || key
        prompt += `- ${label}: ${value}\n`
      }
    })
  }

  return prompt
}

module.exports = {
  agentTemplates,
  getAllTemplates,
  getTemplateById,
  generateSystemPrompt
}
