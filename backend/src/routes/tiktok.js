const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')

// ============================================
// TIKTOK OAUTH ONBOARDING (Messages + Ads)
// Receives authorization code from TikTok Login Kit
// ============================================
router.post('/onboarding', auth, async (req, res) => {
  try {
    const { code, type, redirect_uri } = req.body
    if (!code || !type) {
      return res.status(400).json({ error: 'Missing code or type' })
    }

    const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY
    const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET
    if (!CLIENT_KEY || !CLIENT_SECRET) {
      return res.status(500).json({ error: 'Missing TikTok credentials in server config' })
    }

    const pool = req.pool
    const userId = req.user.id
    const REDIRECT_URI = redirect_uri || process.env.TIKTOK_REDIRECT_URI || 'https://agents.pivotsoluciones.com/api/integrations/tiktok/callback'

    // Exchange code for access token
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI
      })
    })

    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      return res.status(400).json({ error: tokenData.error_description || 'Failed to get access token from TikTok' })
    }

    const { access_token, refresh_token, open_id, scope } = tokenData

    if (type === 'tiktok') {
      // Get user info
      const userInfoRes = await fetch('https://open.tiktokapis.com/v2/user/info/', {
        headers: { 'Authorization': `Bearer ${access_token}` }
      })
      const userInfo = await userInfoRes.json()
      const displayName = userInfo.data?.user?.display_name || 'TikTok User'
      const username = userInfo.data?.user?.username || ''

      const tiktokConfig = {
        open_id,
        display_name: displayName,
        username,
        access_token,
        refresh_token,
        scope,
        connected_at: new Date().toISOString()
      }

      const check = await pool.query('SELECT user_id FROM user_integrations WHERE user_id = $1', [userId])
      if (check.rows.length === 0) {
        await pool.query('INSERT INTO user_integrations (user_id, tiktok_config) VALUES ($1, $2)', [userId, JSON.stringify(tiktokConfig)])
      } else {
        await pool.query('UPDATE user_integrations SET tiktok_config = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', [JSON.stringify(tiktokConfig), userId])
      }

      console.log(`[TikTok Onboarding] User ${userId} connected TikTok: ${displayName} (${open_id})`)
      return res.json({ success: true, display_name: displayName, open_id })

    } else if (type === 'tiktok_ads') {
      // Get advertiser info
      const advertiserRes = await fetch('https://business-api.tiktok.com/open_api/v1.3/advertiser/info/', {
        headers: { 'Access-Token': access_token }
      })
      const advertiserData = await advertiserRes.json()

      let advertiserId = null
      let advertiserName = 'TikTok Advertiser'

      if (advertiserData.data?.list?.length > 0) {
        const adv = advertiserData.data.list[0]
        advertiserId = adv.advertiser_id
        advertiserName = adv.name
      }

      const tiktokAdsConfig = {
        open_id,
        advertiser_id: advertiserId,
        advertiser_name: advertiserName,
        access_token,
        refresh_token,
        connected_at: new Date().toISOString()
      }

      const check = await pool.query('SELECT user_id FROM user_integrations WHERE user_id = $1', [userId])
      if (check.rows.length === 0) {
        await pool.query('INSERT INTO user_integrations (user_id, tiktok_ads_config) VALUES ($1, $2)', [userId, JSON.stringify(tiktokAdsConfig)])
      } else {
        await pool.query('UPDATE user_integrations SET tiktok_ads_config = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', [JSON.stringify(tiktokAdsConfig), userId])
      }

      console.log(`[TikTok Ads Onboarding] User ${userId} connected advertiser: ${advertiserName} (${advertiserId})`)
      return res.json({ success: true, advertiser_name: advertiserName, advertiser_id: advertiserId })
    }

    return res.status(400).json({ error: 'Invalid type. Use "tiktok" or "tiktok_ads".' })
  } catch (error) {
    console.error('[TikTok Onboarding Error]:', error)
    res.status(500).json({ error: 'Error interno al procesar la conexión con TikTok.' })
  }
})

// ============================================
// TIKTOK WEBHOOK: Receive messages
// ============================================
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body

    // TikTok sends message events
    if (event.event === 'im.message.receive_v1') {
      const { sender, recipient, message } = event
      console.log('[TikTok Webhook] Received message:', JSON.stringify(event, null, 2))

      // Find user by open_id
      const pool = global.pool
      const userRes = await pool.query(
        `SELECT ui.user_id, a.id as agent_id FROM user_integrations ui
         JOIN agents a ON a.user_id = ui.user_id
         WHERE ui.tiktok_config->>'open_id' = $1 AND a.is_active = true
         LIMIT 1`,
        [sender.open_id]
      )

      if (userRes.rows.length === 0) {
        console.log('[TikTok Webhook] No active agent found for user')
        return res.status(200).json({ status: 'ignored' })
      }

      const { user_id, agent_id } = userRes.rows[0]
      const messageText = message.content?.text || ''

      // Create or find lead
      let leadRes = await pool.query(
        `SELECT id FROM leads WHERE agent_id = $1 AND tiktok_open_id = $2`,
        [agent_id, sender.open_id]
      )

      let leadId
      if (leadRes.rows.length === 0) {
        const newLead = await pool.query(
          `INSERT INTO leads (agent_id, client_phone, name, tiktok_open_id, status, source)
           VALUES ($1, $2, $3, $4, 'nuevo', 'tiktok') RETURNING id`,
          [agent_id, '', sender.open_id || 'Unknown', sender.open_id]
        )
        leadId = newLead.rows[0].id
      } else {
        leadId = leadRes.rows[0].id
        await pool.query('UPDATE leads SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [leadId])
      }

      // Save message
      await pool.query(
        `INSERT INTO messages (lead_id, sender_type, content, message_type, source)
         VALUES ($1, 'client', $2, 'text', 'tiktok')`,
        [leadId, messageText]
      )

      // Process with AI (reuse webhook logic)
      try {
        const aiResponse = await processTikTokWithAI(agent_id, leadId, messageText)
        if (aiResponse) {
          await pool.query(
            `INSERT INTO messages (lead_id, sender_type, content, message_type, source)
             VALUES ($1, 'agent', $2, 'text', 'tiktok')`,
            [leadId, aiResponse]
          )

          // Send response back to TikTok
          await sendTikTokMessage(sender.open_id, aiResponse)
        }
      } catch (aiErr) {
        console.error('[TikTok Webhook AI Error]:', aiErr)
      }
    }

    res.status(200).json({ status: 'ok' })
  } catch (error) {
    console.error('[TikTok Webhook Error]:', error)
    res.status(200).json({ status: 'error' })
  }
})

// ============================================
// TIKTOK WEBHOOK VERIFICATION
// ============================================
router.get('/webhook', async (req, res) => {
  const { challenge, state } = req.query
  console.log('[TikTok Webhook Verify] challenge:', challenge)
  if (challenge) {
    res.status(200).send(challenge)
  } else {
    res.status(200).send('ok')
  }
})

// ============================================
// SEND TIKTOK MESSAGE
// ============================================
async function sendTikTokMessage(openId, text) {
  try {
    const pool = global.pool
    const configRes = await pool.query(
      `SELECT tiktok_config FROM user_integrations WHERE tiktok_config->>'open_id' = $1`,
      [openId]
    )

    if (configRes.rows.length === 0) {
      console.error('[TikTok Send] No config found for open_id:', openId)
      return
    }

    const config = configRes.rows[0].tiktok_config
    const accessToken = config.access_token

    // TikTok Messaging API
    const res = await fetch('https://open.tiktokapis.com/v2/conversation/message/send/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        receiver_open_id: openId,
        content_type: 'text',
        content: { text }
      })
    })

    const data = await res.json()
    console.log('[TikTok Send] Response:', data)
    return data
  } catch (error) {
    console.error('[TikTok Send Error]:', error)
  }
}

// ============================================
// TIKTOK ADS: Get campaigns with metrics
// ============================================
router.get('/campaigns', auth, async (req, res) => {
  try {
    const pool = req.pool
    const result = await pool.query(
      'SELECT tiktok_ads_config FROM user_integrations WHERE user_id = $1',
      [req.user.id]
    )

    if (result.rows.length === 0 || !result.rows[0].tiktok_ads_config) {
      return res.json({ success: false, error: 'TikTok Ads no conectado' })
    }

    const config = typeof result.rows[0].tiktok_ads_config === 'string'
      ? JSON.parse(result.rows[0].tiktok_ads_config)
      : result.rows[0].tiktok_ads_config

    const { advertiser_id, access_token } = config
    if (!advertiser_id || !access_token) {
      return res.json({ success: false, error: 'Faltan credenciales de TikTok Ads' })
    }

    // Fetch campaigns
    const campaignsRes = await fetch(
      `https://business-api.tiktok.com/open_api/v1.3/campaign/list/?advertiser_id=${advertiser_id}&page_size=50`,
      { headers: { 'Access-Token': access_token } }
    )
    const campaignsData = await campaignsRes.json()

    if (campaignsData.code !== 0) {
      return res.json({ success: false, error: campaignsData.message || 'Error fetching campaigns' })
    }

    // Fetch account-level insights (last 30 days)
    const today = new Date().toISOString().split('T')[0]
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const insightsRes = await fetch(
      `https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/?advertiser_id=${advertiser_id}&start_date=${thirtyDaysAgo}&end_date=${today}&dimensions=["Campaign"]&metrics=["impressions","clicks","ctr","cpc","reach","cost","conversion"]`,
      { headers: { 'Access-Token': access_token } }
    )
    const insightsData = await insightsRes.json()

    // Count CRM leads from TikTok
    let crmLeads = 0
    try {
      const leadsRes = await pool.query(
        `SELECT COUNT(*) as total FROM leads WHERE source = 'tiktok' AND created_at > NOW() - INTERVAL '30 days'`
      )
      crmLeads = parseInt(leadsRes.rows[0].total) || 0
    } catch (e) {}

    const campaigns = (campaignsData.data?.list || []).slice(0, 20).map(c => {
      const insight = (insightsData.data?.rows || []).find(r => r.campaign_name === c.campaign_name)
      return { ...c, insights: insight || null }
    })

    const summary = insightsData.data?.rows?.[0] || null

    res.json({
      success: true,
      account: { id: advertiser_id, name: config.advertiser_name },
      summary,
      campaigns,
      crm_leads_30d: crmLeads
    })
  } catch (error) {
    console.error('[TikTok Ads Campaigns Error]:', error)
    res.status(500).json({ success: false, error: 'Error obteniendo campañas de TikTok' })
  }
})

// ============================================
// GET TikTok Auth URL (for frontend redirect)
// ============================================
router.get('/auth-url', auth, (req, res) => {
  const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY
  const REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI || 'https://agents.pivotsoluciones.com/api/integrations/tiktok/callback'
  const scope = req.query.scope || 'user.info.basic,im.message.send'

  if (!CLIENT_KEY) {
    return res.status(500).json({ error: 'Missing TIKTOK_CLIENT_KEY' })
  }

  const state = Buffer.from(JSON.stringify({ userId: req.user.id })).toString('base64')
  const url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${CLIENT_KEY}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`

  res.json({ success: true, url })
})

router.get('/ads-auth-url', auth, (req, res) => {
  const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY
  const REDIRECT_URI = process.env.TIKTOK_ADS_REDIRECT_URI || 'https://agents.pivotsoluciones.com/api/integrations/tiktok/ads-callback'
  const scope = req.query.scope || 'ads.manage,ads.read'

  if (!CLIENT_KEY) {
    return res.status(500).json({ error: 'Missing TIKTOK_CLIENT_KEY' })
  }

  const state = Buffer.from(JSON.stringify({ userId: req.user.id })).toString('base64')
  const url = `https://ads.tiktok.com/marketing_api/auth?app_id=${CLIENT_KEY}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}&scope=${encodeURIComponent(scope)}`

  res.json({ success: true, url })
})

// ============================================
// CALLBACK: TikTok OAuth
// ============================================
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query
    if (!code || !state) {
      return res.redirect((process.env.FRONTEND_URL || 'https://agents.pivotsoluciones.com') + '/integrations?tiktok=error&reason=missing_params')
    }

    let userId
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString())
      userId = decoded.userId
    } catch (e) {
      return res.redirect((process.env.FRONTEND_URL || 'https://agents.pivotsoluciones.com') + '/integrations?tiktok=error&reason=invalid_state')
    }

    const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY
    const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET
    const REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI || 'https://agents.pivotsoluciones.com/api/integrations/tiktok/callback'

    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI
      })
    })

    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      return res.redirect((process.env.FRONTEND_URL || 'https://agents.pivotsoluciones.com') + '/integrations?tiktok=error&reason=token_failed')
    }

    const { access_token, refresh_token, open_id, scope } = tokenData

    const userInfoRes = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    })
    const userInfo = await userInfoRes.json()
    const displayName = userInfo.data?.user?.display_name || 'TikTok User'

    const tiktokConfig = {
      open_id,
      display_name: displayName,
      username: userInfo.data?.user?.username || '',
      access_token,
      refresh_token,
      scope,
      connected_at: new Date().toISOString()
    }

    const pool = global.pool
    const check = await pool.query('SELECT user_id FROM user_integrations WHERE user_id = $1', [userId])
    if (check.rows.length === 0) {
      await pool.query('INSERT INTO user_integrations (user_id, tiktok_config) VALUES ($1, $2)', [userId, JSON.stringify(tiktokConfig)])
    } else {
      await pool.query('UPDATE user_integrations SET tiktok_config = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', [JSON.stringify(tiktokConfig), userId])
    }

    console.log(`[TikTok Callback] User ${userId} connected TikTok: ${displayName}`)
    res.redirect((process.env.FRONTEND_URL || 'https://agents.pivotsoluciones.com') + '/integrations?tiktok=success')
  } catch (error) {
    console.error('[TikTok Callback Error]:', error)
    res.redirect((process.env.FRONTEND_URL || 'https://agents.pivotsoluciones.com') + '/integrations?tiktok=error&reason=callback_failed')
  }
})

// ============================================
// CALLBACK: TikTok Ads OAuth
// ============================================
router.get('/ads-callback', async (req, res) => {
  try {
    const { code, state } = req.query
    if (!code || !state) {
      return res.redirect((process.env.FRONTEND_URL || 'https://agents.pivotsoluciones.com') + '/integrations?tiktok_ads=error&reason=missing_params')
    }

    let userId
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString())
      userId = decoded.userId
    } catch (e) {
      return res.redirect((process.env.FRONTEND_URL || 'https://agents.pivotsoluciones.com') + '/integrations?tiktok_ads=error&reason=invalid_state')
    }

    const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY
    const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET
    const REDIRECT_URI = process.env.TIKTOK_ADS_REDIRECT_URI || 'https://agents.pivotsoluciones.com/api/integrations/tiktok/ads-callback'

    const tokenRes = await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: CLIENT_KEY,
        secret: CLIENT_SECRET,
        auth_code: code,
        grant_type: 'authorization_code'
      })
    })

    const tokenData = await tokenRes.json()
    if (!tokenData.data?.access_token) {
      return res.redirect((process.env.FRONTEND_URL || 'https://agents.pivotsoluciones.com') + '/integrations?tiktok_ads=error&reason=token_failed')
    }

    const { access_token, refresh_token, advertiser_ids } = tokenData.data

    const tiktokAdsConfig = {
      advertiser_id: advertiser_ids?.[0] || '',
      advertiser_name: 'TikTok Advertiser',
      access_token,
      refresh_token,
      connected_at: new Date().toISOString()
    }

    const pool = global.pool
    const check = await pool.query('SELECT user_id FROM user_integrations WHERE user_id = $1', [userId])
    if (check.rows.length === 0) {
      await pool.query('INSERT INTO user_integrations (user_id, tiktok_ads_config) VALUES ($1, $2)', [userId, JSON.stringify(tiktokAdsConfig)])
    } else {
      await pool.query('UPDATE user_integrations SET tiktok_ads_config = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', [JSON.stringify(tiktokAdsConfig), userId])
    }

    console.log(`[TikTok Ads Callback] User ${userId} connected advertiser: ${tiktokAdsConfig.advertiser_id}`)
    res.redirect((process.env.FRONTEND_URL || 'https://agents.pivotsoluciones.com') + '/integrations?tiktok_ads=success')
  } catch (error) {
    console.error('[TikTok Ads Callback Error]:', error)
    res.redirect((process.env.FRONTEND_URL || 'https://agents.pivotsoluciones.com') + '/integrations?tiktok_ads=error&reason=callback_failed')
  }
})

module.exports = router

// ============================================
// AI PROCESSING FOR TIKTOK
// ============================================
async function processTikTokWithAI(agentId, leadId, messageText) {
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

    // Check if AI is active for this lead
    const leadCheck = await pool.query('SELECT is_ai_active FROM leads WHERE id = $1 LIMIT 1', [leadId])
    const isAiActive = leadCheck.rows.length > 0 ? leadCheck.rows[0].is_ai_active : true
    if (!isAiActive) return null

    // Check active stages
    const leadStageCheck = await pool.query('SELECT stage_id FROM leads WHERE id = $1 LIMIT 1', [leadId])
    const leadStageId = leadStageCheck.rows.length > 0 ? leadStageCheck.rows[0].stage_id : null
    if (agent.active_funnels) {
      const activeStages = typeof agent.active_funnels === 'string' ? JSON.parse(agent.active_funnels) : agent.active_funnels
      if (Array.isArray(activeStages) && activeStages.length > 0 && leadStageId && !activeStages.includes(leadStageId)) {
        console.log(`[TikTok AI] Lead stage ${leadStageId} not in active stages. Ignoring.`)
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
    console.error('[TikTok AI Processing Error]:', error)
    return null
  }
}
