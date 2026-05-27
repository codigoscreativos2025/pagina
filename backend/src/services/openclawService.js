class OpenClawService {
  constructor(openclawUrl) {
    this.openclawUrl = openclawUrl || process.env.OPENCLAW_URL || 'http://openclaw:18789'
    this.token = process.env.OPENCLAW_GATEWAY_TOKEN
  }

  async sendMessage(userId, message, agentConfig, contextExtras = {}) {
    const sessionId = `user_${userId}_session`

    const parseJSON = (data) => {
      if (!data) return {};
      if (typeof data === 'object') return data;
      try { return JSON.parse(data); } catch (e) { return {}; }
    }

    let systemContent = '';
    if (agentConfig.system_prompt) {
      systemContent = agentConfig.system_prompt;
    }

    const businessInfo = parseJSON(agentConfig.business_info);
    const googleSheets = parseJSON(agentConfig.google_sheets_config);

    if (Object.keys(businessInfo).length > 0) {
      systemContent += `\n\n[Business Info]\n${JSON.stringify(businessInfo)}`;
    }
    if (Object.keys(googleSheets).length > 0) {
      systemContent += `\n\n[Sheets Info]\n${JSON.stringify(googleSheets)}`;
    }

    if (contextExtras.mediaContext) {
      systemContent += `\n\n[Media Context]\n${contextExtras.mediaContext}`;
    }

    if (contextExtras.templateContext && contextExtras.templateContext.length > 0) {
      const templatesDesc = contextExtras.templateContext.map(t =>
        `- "${t.name}" (${t.category}): ${t.body_text}${t.usage_context ? ` | Uso: ${t.usage_context}` : ''}`
      ).join('\n');
      systemContent += `\n\n[Available WhatsApp Templates]\nYou can proactively send these templates when appropriate:\n${templatesDesc}\nTo send a template, respond with: SEND_TEMPLATE:template_name`;
    }

    // Inject agent tools & permissions
    const aiConfig = parseJSON(agentConfig.ai_config);
    const permissions = parseJSON(agentConfig.permissions) || [];
    const tools = aiConfig.tools || [];

    if (tools.length > 0 || permissions.length > 0) {
      systemContent += '\n\n[Agent Capabilities & Permissions]';
      
      if (tools.length > 0) {
        systemContent += '\nConfigured Tools:';
        tools.forEach(tool => {
          systemContent += `\n- ${tool.label || tool.type}: ${tool.description || 'available'}`;
        });
      }
      
      if (permissions.length > 0) {
        systemContent += '\n\nActive Permissions:';
        const permLabels = {
          whatsapp_reply: 'WhatsApp (enviar mensajes)', instagram_reply: 'Instagram (enviar mensajes)',
          facebook_reply: 'Facebook Messenger', tiktok_reply: 'TikTok',
          telegram_notify: 'Telegram (notificaciones)', send_email: 'Email'
        };
        permissions.forEach(p => {
          systemContent += `\n- ${permLabels[p] || p}: ✓ enabled`;
        });
      }
      
      systemContent += '\n\nInstructions: Use these capabilities ONLY within your role. Never respond about topics outside your defined scope. If media (images, audio, documents) is received, describe what action you would take based on your configured tools.';
    }

    try {
      const headers = {
        'Content-Type': 'application/json'
      }
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`
      }

      const response = await fetch(`${this.openclawUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: 'main',
          user: sessionId,
          messages: [
            { role: 'system', content: systemContent },
            { role: 'user', content: message }
          ]
        })
      })

      if (!response.ok) {
        throw new Error(`OpenClaw error: ${response.status} - ${await response.text()}`)
      }

      const data = await response.json()
      return {
        success: true,
        response: data.choices?.[0]?.message?.content || 'Sin respuesta',
        session: sessionId
      }
    } catch (error) {
      console.error('[OpenClaw] Error:', error.message)
      return {
        success: false,
        response: 'Lo siento, estoy teniendo problemas técnicos. Por favor intenta más tarde.',
        session: sessionId,
        error: error.message
      }
    }
  }

  async sendMessageWithContext(userId, message, context) {
    const sessionId = `user_${userId}_session`

    let systemContent = context.systemPrompt || '';

    if (context.businessInfo && Object.keys(context.businessInfo).length > 0) {
      systemContent += `\n\n[Business Info]\n${JSON.stringify(context.businessInfo)}`;
    }
    if (context.googleSheets && Object.keys(context.googleSheets).length > 0) {
      systemContent += `\n\n[Sheets Info]\n${JSON.stringify(context.googleSheets)}`;
    }
    if (context.mediaContext) {
      systemContent += `\n\n[Media Context]\n${context.mediaContext}`;
    }
    if (context.templateContext && context.templateContext.length > 0) {
      const templatesDesc = context.templateContext.map(t =>
        `- "${t.name}" (${t.category}): ${t.body_text}${t.usage_context ? ` | Uso: ${t.usage_context}` : ''}`
      ).join('\n');
      systemContent += `\n\n[Available WhatsApp Templates]\nYou can proactively send these templates when appropriate:\n${templatesDesc}\nTo send a template, respond with: SEND_TEMPLATE:template_name`;
    }

    try {
      const headers = {
        'Content-Type': 'application/json'
      }
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`
      }

      const response = await fetch(`${this.openclawUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: 'main',
          user: sessionId,
          messages: [
            { 
              role: 'system', 
              content: systemContent
            },
            { role: 'user', content: message }
          ]
        })
      })

      if (!response.ok) {
        throw new Error(`OpenClaw error: ${response.status} - ${await response.text()}`)
      }

      const data = await response.json()
      return {
        success: true,
        response: data.choices?.[0]?.message?.content || 'Sin respuesta',
        session: sessionId
      }
    } catch (error) {
      console.error('[OpenClaw] Error:', error.message)
      return {
        success: false,
        response: 'Lo siento, estoy teniendo problemas técnicos.',
        session: sessionId,
        error: error.message
      }
    }
  }

  async clearSession(userId) {
    const sessionId = `user_${userId}_session`

    try {
      const headers = {}
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`
      }

      await fetch(`${this.openclawUrl}/api/session/${sessionId}`, {
        method: 'DELETE',
        headers: headers
      })
      return { success: true }
    } catch (error) {
      console.error('[OpenClaw] Clear session error:', error.message)
      return { success: false, error: error.message }
    }
  }

  async getSessionInfo(userId) {
    const sessionId = `user_${userId}_session`

    try {
      const headers = {}
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`
      }

      const response = await fetch(`${this.openclawUrl}/api/session/${sessionId}`, { headers })
      const data = await response.json()
      return { success: true, session: data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async testConnection() {
    try {
      const headers = {}
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`
      }
      const response = await fetch(`${this.openclawUrl}/health`, { headers })
      return { success: response.ok }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

module.exports = OpenClawService
