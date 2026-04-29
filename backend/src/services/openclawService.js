class OpenClawService {
  constructor(openclawUrl) {
    this.openclawUrl = openclawUrl || process.env.OPENCLAW_URL || 'http://openclaw:18789'
    this.token = process.env.OPENCLAW_GATEWAY_TOKEN
  }

  async sendMessage(userId, message, agentConfig) {
    const sessionId = `user_${userId}_session`

    const parseJSON = (data) => {
      if (!data) return {};
      if (typeof data === 'object') return data;
      try { return JSON.parse(data); } catch (e) { return {}; }
    }

    const context = {
      systemPrompt: agentConfig.system_prompt,
      businessInfo: parseJSON(agentConfig.business_info),
      googleSheets: parseJSON(agentConfig.google_sheets_config)
    }

    try {
      const headers = {
        'Content-Type': 'application/json'
      }
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`
      }

      const response = await fetch(`${this.openclawUrl}/v1/responses`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: 'main',
          user: sessionId,
          messages: [
            { 
              role: 'system', 
              content: `${context.systemPrompt || ''}\n\n[Business Info]\n${JSON.stringify(context.businessInfo || {})}\n\n[Sheets Info]\n${JSON.stringify(context.googleSheets || {})}` 
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
        response: 'Lo siento, estoy teniendo problemas técnicos. Por favor intenta más tarde.',
        session: sessionId,
        error: error.message
      }
    }
  }

  async sendMessageWithContext(userId, message, context) {
    const sessionId = `user_${userId}_session`

    try {
      const headers = {
        'Content-Type': 'application/json'
      }
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`
      }

      const response = await fetch(`${this.openclawUrl}/v1/responses`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: 'main',
          user: sessionId,
          messages: [
            { 
              role: 'system', 
              content: `${context.systemPrompt || ''}\n\n[Business Info]\n${JSON.stringify(context.businessInfo || {})}\n\n[Sheets Info]\n${JSON.stringify(context.googleSheets || {})}` 
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
