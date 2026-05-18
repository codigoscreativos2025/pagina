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
    console.error('Error disconnecting integration:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================
// TEST UTILITY MESSAGE (Meta App Review Only)
// ============================================
router.post('/test-utility-message', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    
    // 1. Get user's Facebook page config
    const configRes = await pool.query(
      'SELECT facebook_config FROM user_integrations WHERE user_id = $1',
      [userId]
    )
    
    if (configRes.rows.length === 0 || !configRes.rows[0].facebook_config) {
      return res.status(400).json({ error: 'Facebook not connected' })
    }
    
    const config = configRes.rows[0].facebook_config
    const pageId = config.page_id
    const accessToken = config.access_token
    
    // 2. Find a recent lead (user who messaged in last 24h)
    const leadRes = await pool.query(
      `SELECT facebook_psid FROM leads l
       JOIN agents a ON l.agent_id = a.id
       WHERE a.user_id = $1 
         AND l.facebook_psid IS NOT NULL
         AND l.created_at > NOW() - INTERVAL '24 hours'
       LIMIT 1`,
      [userId]
    )
    
    if (leadRes.rows.length === 0) {
      return res.status(400).json({ 
        error: 'No recent Facebook messenger found. Someone must message your page first.' 
      })
    }
    
    const psid = leadRes.rows[0].facebook_psid
    
    // 3. Make API call to send utility message (CONFIRMATION_UPDATE tag)
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          recipient: { id: psid },
          message: { 
            text: '✅ This is a test confirmation message for Meta App Review. Your appointment has been confirmed.' 
          },
          messaging_type: 'MESSAGE_TAG',
          tag: 'CONFIRMATION_UPDATE'
        })
      }
    )
    
    const data = await response.json()
    
    if (data.error) {
      return res.status(400).json({ error: data.error.message })
    }
    
    // 4. Log for Meta Review
    console.log('[Meta Review Test] Utility message sent:', data)
    
    res.json({ 
      success: true, 
      message: 'Test utility message sent successfully',
      recipient_id: data.recipient_id,
      message_id: data.message_id
    })
    
  } catch (error) {
    console.error('Test utility message error:', error)
    res.status(500).json({ error: error.message })
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
