const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')

// ============================================
// FACEBOOK PAGE OAUTH ONBOARDING (Messenger)
// ============================================
router.post('/onboarding', auth, async (req, res) => {
  try {
    const { access_token, page_id } = req.body
    if (!access_token || !page_id) {
      return res.status(400).json({ error: 'Missing access_token or page_id' })
    }

    const APP_ID = process.env.FACEBOOK_APP_ID
    const APP_SECRET = process.env.FACEBOOK_APP_SECRET
    if (!APP_ID || !APP_SECRET) {
      return res.status(500).json({ error: 'Missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET in server config' })
    }

    const pool = req.pool
    const userId = req.user.id

    // Get page info
    const pageRes = await fetch(
      `https://graph.facebook.com/v18.0/${page_id}?fields=name,access_token&access_token=${access_token}`
    )
    const pageData = await pageRes.json()

    if (pageData.error) {
      return res.status(400).json({ error: pageData.error.message })
    }

    const pageAccessToken = pageData.access_token || access_token
    const pageName = pageData.name || 'Facebook Page'

    // Subscribe app to page webhooks
    const subRes = await fetch(`https://graph.facebook.com/v18.0/${page_id}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,messaging_optins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: pageAccessToken })
    })
    const subData = await subRes.json()
    console.log(`[Facebook Onboarding] subscribed_apps response for Page ${page_id}:`, subData)

    const facebookConfig = {
      page_id,
      page_name: pageName,
      access_token: pageAccessToken,
      user_access_token: access_token,
      connected_at: new Date().toISOString()
    }

    const check = await pool.query('SELECT user_id FROM user_integrations WHERE user_id = $1', [userId])
    if (check.rows.length === 0) {
      await pool.query('INSERT INTO user_integrations (user_id, facebook_config) VALUES ($1, $2)', [userId, JSON.stringify(facebookConfig)])
    } else {
      await pool.query('UPDATE user_integrations SET facebook_config = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', [JSON.stringify(facebookConfig), userId])
    }

    console.log(`[Facebook Onboarding] User ${userId} connected Page: ${pageName} (${page_id})`)
    res.json({ success: true, page_name: pageName, page_id })
  } catch (error) {
    console.error('[Facebook Onboarding Error]:', error)
    res.status(500).json({ error: 'Error interno al procesar la conexión con Facebook.' })
  }
})

// ============================================
// FACEBOOK MESSENGER MESSAGE HANDLER
// ============================================
async function handleFacebookMessages(body, req) {
  const pool = global.pool

  for (const entry of body.entry) {
    const pageId = entry.id
    const messaging = entry.messaging || []

    for (const event of messaging) {
      if (!event.message || !event.sender || event.message.is_echo) continue

      const senderId = event.sender.id
      const messageText = event.message.text || ''
      const messageId = event.message.mid

      console.log(`[Facebook Webhook] Message from ${senderId}: ${messageText}`)

      // Find user by page_id
      const userRes = await pool.query(
        `SELECT ui.user_id, a.id as agent_id FROM user_integrations ui
         JOIN agents a ON a.user_id = ui.user_id
         WHERE ui.facebook_config->>'page_id' = $1 AND a.is_active = true
         LIMIT 1`,
        [pageId]
      )

      if (userRes.rows.length === 0) {
        console.log('[Facebook Webhook] No active agent found for page:', pageId)
        continue
      }

      const { user_id, agent_id } = userRes.rows[0]

      // Create or find lead
      let leadRes = await pool.query(
        `SELECT id FROM leads WHERE agent_id = $1 AND facebook_psid = $2`,
        [agent_id, senderId]
      )

      let leadId
      if (leadRes.rows.length === 0) {
        // Get sender name
        let senderName = 'Facebook User'
        try {
          const configRes = await pool.query(
            `SELECT facebook_config FROM user_integrations WHERE facebook_config->>'page_id' = $1`,
            [pageId]
          )
          if (configRes.rows[0]?.facebook_config?.access_token) {
            const senderRes = await fetch(
              `https://graph.facebook.com/v18.0/${senderId}?fields=first_name&access_token=${configRes.rows[0].facebook_config.access_token}`
            )
            const senderData = await senderRes.json()
            senderName = senderData.first_name || senderName
          }
        } catch (e) {}

        const newLead = await pool.query(
          `INSERT INTO leads (agent_id, client_phone, name, facebook_psid, status, source)
           VALUES ($1, $2, $3, $4, 'nuevo', 'facebook') RETURNING id`,
          [agent_id, '', senderName, senderId]
        )
        leadId = newLead.rows[0].id
      } else {
        leadId = leadRes.rows[0].id
        await pool.query('UPDATE leads SET updated_at = CURRENT_TIMESTAMP, last_client_message_at = CURRENT_TIMESTAMP WHERE id = $1', [leadId])
      }

      // Save message
      await pool.query(
        `INSERT INTO messages (lead_id, sender_type, content, message_type, source, fb_message_id)
         VALUES ($1, 'client', $2, 'text', 'facebook', $3)`,
        [leadId, messageText, messageId]
      )

      // Process with AI
      try {
        const aiResponse = await processFacebookWithAI(agent_id, leadId, messageText, pageId)
        if (aiResponse) {
          await pool.query(
            `INSERT INTO messages (lead_id, sender_type, content, message_type, source)
             VALUES ($1, 'agent', $2, 'text', 'facebook')`,
            [leadId, aiResponse]
          )

          // Send response back via Messenger
          await sendFacebookMessage(senderId, aiResponse, pageId)
        }
      } catch (aiErr) {
        console.error('[Facebook Webhook AI Error]:', aiErr)
      }
    }
  }
}

// ============================================
// FACEBOOK MESSENGER WEBHOOK (GET - Verification)
// ============================================
router.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || 'pivot_verify_token_2024'
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Facebook Webhook] Verified')
    res.status(200).send(challenge)
  } else {
    res.status(403).send('Forbidden')
  }
})

// ============================================
// FACEBOOK MESSENGER WEBHOOK (POST - Receive messages)
// ============================================
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body
    console.log('[Webhook] Received:', JSON.stringify({ object: body.object, entry_count: body.entry?.length }).substring(0, 200))

    if (body.object === 'page') {
      await handleFacebookMessages(body, req)
      res.status(200).send('EVENT_RECEIVED')
    } else if (body.object === 'instagram') {
      await handleInstagramMessages(body, req)
      res.status(200).send('EVENT_RECEIVED')
    } else {
      console.log('[Webhook] Unknown object type:', body.object)
      res.status(200).send('OK')
    }
  } catch (error) {
    console.error('[Facebook/Instagram Webhook Error]:', error)
    res.status(200).send('OK')
  }
})

// ============================================
// INSTAGRAM MESSAGE HANDLER
// ============================================
async function handleInstagramMessages(body, req) {
  const pool = global.pool
  
  for (const entry of body.entry) {
    const pageId = entry.id
    const messaging = entry.messaging || []
    
    console.log(`[Instagram Webhook] Entry page_id: ${pageId}, messaging events: ${messaging.length}`)

    for (const event of messaging) {
      if (!event.message || !event.sender || event.message.is_echo) continue

      const senderId = event.sender.id
      const messageText = event.message.text || ''
      const messageId = event.message.mid

      console.log(`[Instagram Webhook] Message from ${senderId}: ${messageText}`)

      // Meta sends the Instagram Business Account ID (starts with 17841...)
      // We need to match against BOTH page_id and ig_account_id
      const userRes = await pool.query(
        `SELECT ui.user_id, ui.instagram_config, a.id as agent_id FROM user_integrations ui
         JOIN agents a ON a.user_id = ui.user_id
         WHERE (ui.instagram_config->>'page_id' = $1 OR ui.instagram_config->>'ig_account_id' = $1) AND a.is_active = true
         LIMIT 1`,
        [pageId]
      )

      if (userRes.rows.length === 0) {
        console.log(`[Instagram Webhook] No active agent found for page_id: ${pageId}`)
        const allConfigs = await pool.query("SELECT user_id, instagram_config->>'page_id' as stored_page_id, instagram_config->>'ig_account_id' as stored_ig_id FROM user_integrations WHERE instagram_config IS NOT NULL")
        console.log('[Instagram Webhook] All stored IG configs:', JSON.stringify(allConfigs.rows))
        continue
      }

      const { user_id, agent_id } = userRes.rows[0]

      // Create or find lead
      let leadRes = await pool.query(
        `SELECT id FROM leads WHERE agent_id = $1 AND instagram_psid = $2`,
        [agent_id, senderId]
      )

      let leadId
      if (leadRes.rows.length === 0) {
        let senderName = 'Instagram User'
        try {
          const configRes = await pool.query(
            `SELECT instagram_config FROM user_integrations WHERE (instagram_config->>'page_id' = $1 OR instagram_config->>'ig_account_id' = $1)`,
            [pageId]
          )
          if (configRes.rows[0]?.instagram_config?.access_token) {
            const accessToken = configRes.rows[0].instagram_config.access_token
            // Try to get username from Instagram profile
            const senderRes = await fetch(
              `https://graph.facebook.com/v18.0/${senderId}?fields=username,name&access_token=${accessToken}`
            )
            const senderData = await senderRes.json()
            if (senderData.username) {
              senderName = senderData.username
            } else if (senderData.name) {
              senderName = senderData.name
            }
            console.log(`[Instagram Webhook] Sender ${senderId} name: ${senderName}`, senderData)
          }
        } catch (e) {
          console.log(`[Instagram Webhook] Could not fetch sender name: ${e.message}`)
        }

        const newLead = await pool.query(
          `INSERT INTO leads (agent_id, client_phone, name, instagram_psid, status, source)
           VALUES ($1, $2, $3, $4, 'nuevo', 'instagram') RETURNING id`,
          [agent_id, '', senderName, senderId]
        )
        leadId = newLead.rows[0].id
        console.log(`[Instagram Webhook] Created new lead: ${leadId} (${senderName})`)
      } else {
        leadId = leadRes.rows[0].id
        await pool.query('UPDATE leads SET updated_at = CURRENT_TIMESTAMP, last_client_message_at = CURRENT_TIMESTAMP WHERE id = $1', [leadId])
      }

      // Save message
      await pool.query(
        `INSERT INTO messages (lead_id, sender_type, content, message_type, source)
         VALUES ($1, 'client', $2, 'text', 'instagram')`,
        [leadId, messageText]
      )

      // Process with AI
      try {
        const aiResponse = await processInstagramWithAI(agent_id, leadId, messageText, pageId)
        if (aiResponse) {
          await pool.query(
            `INSERT INTO messages (lead_id, sender_type, content, message_type, source)
             VALUES ($1, 'agent', $2, 'text', 'instagram')`,
            [leadId, aiResponse]
          )

          // Send response back via Instagram
          await sendInstagramMessage(senderId, aiResponse, pageId)
        }
      } catch (aiErr) {
        console.error('[Instagram Webhook AI Error]:', aiErr)
      }
    }
  }
}

async function sendInstagramMessage(igUserId, text, pageId) {
  try {
    const pool = global.pool
    const configRes = await pool.query(
      `SELECT instagram_config FROM user_integrations WHERE (instagram_config->>'page_id' = $1 OR instagram_config->>'ig_account_id' = $1)`,
      [pageId]
    )

    if (configRes.rows.length === 0) {
      console.error('[Instagram Send] No config found for page_id:', pageId)
      return
    }

    const config = configRes.rows[0].instagram_config
    const accessToken = config.access_token

    console.log(`[Instagram Send] Sending to ${igUserId}`)

    const res = await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: igUserId },
          message: { text }
        })
      }
    )

    const data = await res.json()
    console.log('[Instagram Send] Response:', data)
    return data
  } catch (error) {
    console.error('[Instagram Send Error]:', error)
  }
}

async function processInstagramWithAI(agentId, leadId, messageText, pageId) {
  try {
    const pool = global.pool
    const OpenClawService = require('../services/openclawService')

    const agentRes = await pool.query(
      `SELECT a.*, u.id as user_id, u.plan_id
       FROM agents a
       JOIN users u ON a.user_id = u.id
       WHERE a.id = $1 AND a.is_active = true AND u.is_active = true`,
      [agentId]
    )

    if (agentRes.rows.length === 0) return null

    const agent = agentRes.rows[0]

    const leadCheck = await pool.query('SELECT is_ai_active FROM leads WHERE id = $1 LIMIT 1', [leadId])
    const isAiActive = leadCheck.rows.length > 0 ? leadCheck.rows[0].is_ai_active : true
    if (!isAiActive) return null

    const leadStageCheck = await pool.query('SELECT stage_id FROM leads WHERE id = $1 LIMIT 1', [leadId])
    const leadStageId = leadStageCheck.rows.length > 0 ? leadStageCheck.rows[0].stage_id : null
    if (agent.active_funnels) {
      const activeStages = typeof agent.active_funnels === 'string' ? JSON.parse(agent.active_funnels) : agent.active_funnels
      if (Array.isArray(activeStages) && activeStages.length > 0 && leadStageId && !activeStages.includes(leadStageId)) {
        console.log(`[Instagram AI] Lead stage ${leadStageId} not in active stages. Ignoring.`)
        return null
      }
    }

    const openclawService = new OpenClawService(process.env.OPENCLAW_URL)
    const contextExtras = {}

    try {
      const templates = await pool.query(
        `SELECT t.name, t.display_name, t.category, t.body_text, t.language, at.usage_context
         FROM wa_templates t
         JOIN agent_templates at ON at.template_id = t.id
         WHERE at.agent_id = $1 AND at.enabled = true AND t.status = 'APPROVED'`,
        [agentId]
      )
      contextExtras.templateContext = templates.rows
    } catch (e) {}

    const result = await openclawService.sendMessage(agent.user_id, messageText, agent, contextExtras)

    if (result.success && result.response) {
      return result.response.replace(/SEND_TEMPLATE:\w+[\s]*/g, '').trim()
    }

    return null
  } catch (error) {
    console.error('[Instagram AI Processing Error]:', error)
    return null
  }
}

// ============================================
// SEND FACEBOOK MESSAGE
// ============================================
async function sendFacebookMessage(psid, text, pageId) {
  try {
    const pool = global.pool
    const configRes = await pool.query(
      `SELECT facebook_config FROM user_integrations WHERE facebook_config->>'page_id' = $1`,
      [pageId]
    )

    if (configRes.rows.length === 0) {
      console.error('[Facebook Send] No config found for page_id:', pageId)
      return
    }

    const config = configRes.rows[0].facebook_config
    const pageAccessToken = config.access_token

    const res = await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${pageAccessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: psid },
          message: { text }
        })
      }
    )

    const data = await res.json()
    console.log('[Facebook Send] Response:', data)
    return data
  } catch (error) {
    console.error('[Facebook Send Error]:', error)
  }
}

// ============================================
// GET Facebook Page Auth URL (for frontend SDK)
// ============================================
router.get('/pages', auth, async (req, res) => {
  try {
    const { access_token } = req.query
    if (!access_token) {
      return res.status(400).json({ error: 'Missing access_token' })
    }

    const pagesRes = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token&access_token=${access_token}`
    )
    const pagesData = await pagesRes.json()

    if (pagesData.error) {
      return res.json({ success: false, error: pagesData.error.message })
    }

    res.json({
      success: true,
      pages: pagesData.data || []
    })
  } catch (error) {
    console.error('[Facebook Pages Error]:', error)
    res.status(500).json({ error: 'Error obteniendo páginas' })
  }
})

// ============================================
// FACEBOOK METRICS (for dashboard)
// ============================================
router.get('/metrics', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id

    // Check if Facebook is connected
    const configRes = await pool.query(
      'SELECT facebook_config FROM user_integrations WHERE user_id = $1',
      [userId]
    )

    const connected = configRes.rows.length > 0 && configRes.rows[0].facebook_config

    // Get CRM metrics for Facebook leads
    const leadsRes = await pool.query(
      `SELECT COUNT(*) as total FROM leads WHERE source = 'facebook' AND agent_id IN (SELECT id FROM agents WHERE user_id = $1)`,
      [userId]
    )
    const totalLeads = parseInt(leadsRes.rows[0].total) || 0

    const recentLeadsRes = await pool.query(
      `SELECT COUNT(*) as total FROM leads WHERE source = 'facebook' AND created_at > NOW() - INTERVAL '7 days' AND agent_id IN (SELECT id FROM agents WHERE user_id = $1)`,
      [userId]
    )
    const recentLeads = parseInt(recentLeadsRes.rows[0].total) || 0

    const messagesRes = await pool.query(
      `SELECT COUNT(*) as total FROM messages WHERE source = 'facebook' AND lead_id IN (SELECT id FROM leads WHERE agent_id IN (SELECT id FROM agents WHERE user_id = $1))`,
      [userId]
    )
    const totalMessages = parseInt(messagesRes.rows[0].total) || 0

    res.json({
      success: true,
      connected,
      page_name: connected ? configRes.rows[0].facebook_config.page_name : null,
      metrics: {
        total_leads: totalLeads,
        leads_7d: recentLeads,
        total_messages: totalMessages
      }
    })
  } catch (error) {
    console.error('[Facebook Metrics Error]:', error)
    res.status(500).json({ error: 'Error obteniendo métricas' })
  }
})

module.exports = router

// ============================================
// AI PROCESSING FOR FACEBOOK
// ============================================
async function processFacebookWithAI(agentId, leadId, messageText, pageId) {
  try {
    const pool = global.pool
    const OpenClawService = require('../services/openclawService')

    const agentRes = await pool.query(
      `SELECT a.*, u.id as user_id, u.plan_id
       FROM agents a
       JOIN users u ON a.user_id = u.id
       WHERE a.id = $1 AND a.is_active = true AND u.is_active = true`,
      [agentId]
    )

    if (agentRes.rows.length === 0) return null

    const agent = agentRes.rows[0]

    const leadCheck = await pool.query('SELECT is_ai_active FROM leads WHERE id = $1 LIMIT 1', [leadId])
    const isAiActive = leadCheck.rows.length > 0 ? leadCheck.rows[0].is_ai_active : true
    if (!isAiActive) return null

    const leadStageCheck = await pool.query('SELECT stage_id FROM leads WHERE id = $1 LIMIT 1', [leadId])
    const leadStageId = leadStageCheck.rows.length > 0 ? leadStageCheck.rows[0].stage_id : null
    if (agent.active_funnels) {
      const activeStages = typeof agent.active_funnels === 'string' ? JSON.parse(agent.active_funnels) : agent.active_funnels
      if (Array.isArray(activeStages) && activeStages.length > 0 && leadStageId && !activeStages.includes(leadStageId)) {
        console.log(`[Facebook AI] Lead stage ${leadStageId} not in active stages. Ignoring.`)
        return null
      }
    }

    const openclawService = new OpenClawService(process.env.OPENCLAW_URL)
    const contextExtras = {}

    try {
      const templates = await pool.query(
        `SELECT t.name, t.display_name, t.category, t.body_text, t.language, at.usage_context
         FROM wa_templates t
         JOIN agent_templates at ON at.template_id = t.id
         WHERE at.agent_id = $1 AND at.enabled = true AND t.status = 'APPROVED'`,
        [agentId]
      )
      contextExtras.templateContext = templates.rows
    } catch (e) {}

    const result = await openclawService.sendMessage(agent.user_id, messageText, agent, contextExtras)

    if (result.success && result.response) {
      return result.response.replace(/SEND_TEMPLATE:\w+[\s]*/g, '').trim()
    }

    return null
  } catch (error) {
    console.error('[Facebook AI Processing Error]:', error)
    return null
  }
}
