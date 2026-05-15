const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { google } = require('googleapis')

// ============================================
// GET: User integrations
// ============================================
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.pool
    const result = await pool.query('SELECT * FROM user_integrations WHERE user_id = $1', [req.user.id])
    
    if (result.rows.length === 0) {
      return res.json({ success: true, integrations: {} })
    }
    
    res.json({ success: true, integrations: result.rows[0] })
  } catch (error) {
    console.error('Error fetching integrations:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================
// PUT: Update single integration manually
// ============================================
router.put('/:type', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const type = req.params.type
    const config = req.body
    
    const allowedTypes = ['whatsapp', 'instagram', 'google', 'telegram', 'meta_ads', 'tiktok', 'facebook', 'tiktok_ads']
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid integration type' })
    }

    const column = `${type}_config`

    const check = await pool.query('SELECT user_id FROM user_integrations WHERE user_id = $1', [userId])
    
    if (check.rows.length === 0) {
      await pool.query(
        `INSERT INTO user_integrations (user_id, ${column}) VALUES ($1, $2)`,
        [userId, JSON.stringify(config)]
      )
    } else {
      await pool.query(
        `UPDATE user_integrations SET ${column} = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
        [JSON.stringify(config), userId]
      )
    }

    // CRITICAL: For WhatsApp, also sync to agents table so webhooks/CRM/templates work
    if (type === 'whatsapp') {
      const agentExist = await pool.query('SELECT id, whatsapp_config FROM agents WHERE user_id = $1', [userId])
      const mergedConfig = { ...(agentExist.rows[0]?.whatsapp_config || {}), ...config }
      if (agentExist.rows.length > 0) {
        await pool.query('UPDATE agents SET whatsapp_config = $1, is_active = true WHERE user_id = $2', [JSON.stringify(mergedConfig), userId])
      } else {
        await pool.query(`INSERT INTO agents (user_id, name, whatsapp_config) VALUES ($1, 'Nuevo Agente', $2)`, [userId, JSON.stringify(mergedConfig)])
      }
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error updating integration:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================
// GET: Meta Configuration IDs for frontend SDK
// ============================================
router.get('/meta/config-ids', auth, (req, res) => {
  res.json({
    success: true,
    app_id: process.env.FACEBOOK_APP_ID || '',
    configs: {
      whatsapp: process.env.META_CONFIG_WHATSAPP || '',
      instagram: process.env.META_CONFIG_INSTAGRAM || '',
      meta_ads: process.env.META_CONFIG_ADS || ''
    }
  })
})

// ============================================
// POST: Meta OAuth Onboarding (Instagram / Meta Ads)
// Receives access_token from FB.login() popup
// ============================================
router.post('/meta/onboarding', auth, async (req, res) => {
  try {
    const { access_token, type } = req.body
    if (!access_token || !type) {
      return res.status(400).json({ error: 'Missing access_token or type' })
    }

    const APP_ID = process.env.FACEBOOK_APP_ID
    const APP_SECRET = process.env.FACEBOOK_APP_SECRET
    if (!APP_ID || !APP_SECRET) {
      return res.status(500).json({ error: 'Missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET in server config' })
    }

    const pool = req.pool
    const userId = req.user.id

    if (type === 'instagram') {
      // 1. Get user's Facebook Pages
      const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${access_token}`)
      const pagesData = await pagesRes.json()
      
      if (!pagesData.data || pagesData.data.length === 0) {
        return res.status(400).json({ error: 'No se encontraron Páginas de Facebook asociadas. Tu cuenta de Instagram profesional debe estar vinculada a una Página de Facebook.' })
      }

      // 2. For each page, try to find the connected Instagram Business Account
      let igAccountId = null
      let pageName = null
      let pageAccessToken = null
      let facebookPageId = null

      for (const page of pagesData.data) {
        const igRes = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account,name&access_token=${page.access_token}`)
        const igData = await igRes.json()
        
        if (igData.instagram_business_account) {
          igAccountId = igData.instagram_business_account.id
          pageName = igData.name
          pageAccessToken = page.access_token
          facebookPageId = page.id
          break
        }
      }

      if (!igAccountId) {
        return res.status(400).json({ error: 'No se encontró una cuenta de Instagram Business vinculada a ninguna de tus Páginas de Facebook.' })
      }

      // 3. Save BOTH the Facebook page_id (for webhook matching) and ig_account_id
      const igConfig = {
        page_id: facebookPageId,
        ig_account_id: igAccountId,
        page_name: pageName,
        access_token: pageAccessToken,
        connected_at: new Date().toISOString()
      }

      const check = await pool.query('SELECT user_id FROM user_integrations WHERE user_id = $1', [userId])
      if (check.rows.length === 0) {
        await pool.query('INSERT INTO user_integrations (user_id, instagram_config) VALUES ($1, $2)', [userId, JSON.stringify(igConfig)])
      } else {
        await pool.query('UPDATE user_integrations SET instagram_config = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', [JSON.stringify(igConfig), userId])
      }

      console.log(`[Instagram Onboarding] User ${userId} connected IG account ${igAccountId} via Page ${facebookPageId} (${pageName})`)
      return res.json({ success: true, ig_account_id: igAccountId, page_name: pageName })

    } else if (type === 'meta_ads') {
      // 1. Get user's ad accounts
      const adAccountsRes = await fetch(`https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status&access_token=${access_token}`)
      const adAccountsData = await adAccountsRes.json()

      if (!adAccountsData.data || adAccountsData.data.length === 0) {
        return res.status(400).json({ error: 'No se encontraron cuentas publicitarias asociadas a tu cuenta de Facebook.' })
      }

      // Pick the first active ad account
      const adAccount = adAccountsData.data.find(a => a.account_status === 1) || adAccountsData.data[0]

      const adsConfig = {
        ad_account_id: adAccount.id,
        ad_account_name: adAccount.name,
        access_token: access_token,
        connected_at: new Date().toISOString()
      }

      const check = await pool.query('SELECT user_id FROM user_integrations WHERE user_id = $1', [userId])
      if (check.rows.length === 0) {
        await pool.query('INSERT INTO user_integrations (user_id, meta_ads_config) VALUES ($1, $2)', [userId, JSON.stringify(adsConfig)])
      } else {
        await pool.query('UPDATE user_integrations SET meta_ads_config = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', [JSON.stringify(adsConfig), userId])
      }

      console.log(`[Meta Ads Onboarding] User ${userId} connected ad account ${adAccount.id} (${adAccount.name})`)
      return res.json({ success: true, ad_account_id: adAccount.id, ad_account_name: adAccount.name })
    }

    return res.status(400).json({ error: 'Invalid type. Use "instagram" or "meta_ads".' })
  } catch (error) {
    console.error('[Meta Onboarding Error]:', error)
    res.status(500).json({ error: 'Error interno al procesar la conexión con Meta.' })
  }
})

// ============================================
// GOOGLE OAUTH 2.0
// ============================================
function getGoogleOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

// GET: Generate Google Auth URL
router.get('/google/auth-url', auth, (req, res) => {
  try {
    const oauth2Client = getGoogleOAuth2Client()
    
    // We encode the user ID in the state param so we know who to save the token for
    const state = Buffer.from(JSON.stringify({ userId: req.user.id })).toString('base64')
    
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      state: state
    })

    res.json({ success: true, url })
  } catch (error) {
    console.error('Error generating Google auth URL:', error)
    res.status(500).json({ error: 'Could not generate Google auth URL' })
  }
})

// GET: Google OAuth Callback (receives authorization code)
// This is NOT auth-protected because Google redirects to it directly
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query
    
    if (!code || !state) {
      return res.redirect((process.env.FRONTEND_URL || 'https://agents.pivotsoluciones.com') + '/integrations?google=error&reason=missing_params')
    }

    // Decode user ID from state
    let userId
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString())
      userId = decoded.userId
    } catch (e) {
      return res.redirect((process.env.FRONTEND_URL || 'https://agents.pivotsoluciones.com') + '/integrations?google=error&reason=invalid_state')
    }

    const oauth2Client = getGoogleOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code)
    
    // Get user email for display
    oauth2Client.setCredentials(tokens)
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    let userEmail = ''
    try {
      const userInfo = await oauth2.userinfo.get()
      userEmail = userInfo.data.email || ''
    } catch (e) { /* optional */ }

    const googleConfig = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date,
      email: userEmail,
      connected_at: new Date().toISOString()
    }

    const pool = global.pool
    const check = await pool.query('SELECT user_id FROM user_integrations WHERE user_id = $1', [userId])
    if (check.rows.length === 0) {
      await pool.query('INSERT INTO user_integrations (user_id, google_config) VALUES ($1, $2)', [userId, JSON.stringify(googleConfig)])
    } else {
      await pool.query('UPDATE user_integrations SET google_config = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', [JSON.stringify(googleConfig), userId])
    }

    console.log(`[Google OAuth] User ${userId} connected Google account: ${userEmail}`)
    
    // Redirect back to frontend integrations page with success
    res.redirect((process.env.FRONTEND_URL || 'https://agents.pivotsoluciones.com') + '/integrations?google=success')
  } catch (error) {
    console.error('[Google OAuth Callback Error]:', error)
    res.redirect((process.env.FRONTEND_URL || 'https://agents.pivotsoluciones.com') + '/integrations?google=error&reason=token_exchange_failed')
  }
})

// ============================================
// META ADS: Get campaigns with metrics
// ============================================
router.get('/meta-ads/campaigns', auth, async (req, res) => {
  try {
    const pool = req.pool || global.pool
    const result = await pool.query(
      'SELECT meta_ads_config FROM user_integrations WHERE user_id = $1',
      [req.user.id]
    )
    if (result.rows.length === 0 || !result.rows[0].meta_ads_config) {
      return res.json({ success: false, error: 'Meta Ads no conectado' })
    }
    const config = typeof result.rows[0].meta_ads_config === 'string'
      ? JSON.parse(result.rows[0].meta_ads_config)
      : result.rows[0].meta_ads_config

    const { ad_account_id, access_token } = config
    if (!ad_account_id || !access_token) {
      return res.json({ success: false, error: 'Faltan credenciales de Meta Ads' })
    }

    // Fetch campaigns with insights
    const campaignsUrl = `https://graph.facebook.com/v18.0/${ad_account_id}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time&access_token=${access_token}&limit=50`
    const campaignsRes = await fetch(campaignsUrl)
    const campaignsData = await campaignsRes.json()

    if (campaignsData.error) {
      return res.json({ success: false, error: campaignsData.error.message })
    }

    // Fetch insights for account level (last 30 days)
    const insightsUrl = `https://graph.facebook.com/v18.0/${ad_account_id}/insights?fields=reach,impressions,clicks,ctr,cpc,cpm,spend,actions&date_preset=last_30d&access_token=${access_token}`
    const insightsRes = await fetch(insightsUrl)
    const insightsData = await insightsRes.json()

    // Fetch per-campaign insights
    const campaignsWithInsights = []
    for (const campaign of (campaignsData.data || []).slice(0, 20)) {
      try {
        const cInsUrl = `https://graph.facebook.com/v18.0/${campaign.id}/insights?fields=reach,impressions,clicks,ctr,cpc,spend,actions&date_preset=last_30d&access_token=${access_token}`
        const cInsRes = await fetch(cInsUrl)
        const cInsData = await cInsRes.json()
        campaignsWithInsights.push({
          ...campaign,
          insights: cInsData.data?.[0] || null
        })
      } catch (e) {
        campaignsWithInsights.push({ ...campaign, insights: null })
      }
    }

    // Count CRM leads
    let crmLeads = 0
    try {
      const leadsRes = await pool.query(
        `SELECT COUNT(*) as total FROM leads l JOIN agents a ON l.agent_id = a.id WHERE a.user_id = $1 AND l.created_at > NOW() - INTERVAL '30 days'`,
        [req.user.id]
      )
      crmLeads = parseInt(leadsRes.rows[0].total) || 0
    } catch (e) { /* optional */ }

    res.json({
      success: true,
      account: { id: ad_account_id, name: config.ad_account_name },
      summary: insightsData.data?.[0] || null,
      campaigns: campaignsWithInsights,
      crm_leads_30d: crmLeads
    })
  } catch (error) {
    console.error('[Meta Ads Campaigns Error]:', error)
    res.status(500).json({ success: false, error: 'Error obteniendo campañas' })
  }
})

module.exports = router

// ============================================
// DELETE: Disconnect an integration
// ============================================
router.delete('/:type', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const type = req.params.type
    
    const allowedTypes = ['whatsapp', 'google', 'instagram', 'telegram', 'meta_ads', 'tiktok', 'facebook', 'tiktok_ads']
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid integration type' })
    }

    const column = `${type}_config`

    // Clear from user_integrations
    await pool.query(
      `UPDATE user_integrations SET ${column} = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1`,
      [userId]
    )

    // For WhatsApp, also deactivate agents
    if (type === 'whatsapp') {
      await pool.query('UPDATE agents SET whatsapp_config = NULL, is_active = false WHERE user_id = $1', [userId])
    }

    // For Google, revoke tokens if possible
    if (type === 'google') {
      try {
        const { google } = require('googleapis')
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        )
        const integrations = await pool.query('SELECT google_config FROM user_integrations WHERE user_id = $1', [userId])
        if (integrations.rows[0]?.google_config?.access_token) {
          oauth2Client.setCredentials({ access_token: integrations.rows[0].google_config.access_token })
          await oauth2Client.revokeToken(integrations.rows[0].google_config.access_token).catch(() => {})
        }
      } catch (e) { console.error('Error revoking Google token:', e) }
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error disconnecting integration:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
