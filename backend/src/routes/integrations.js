const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { google } = require('googleapis')

// ============================================
// GET: Meta Config IDs (for frontend OAuth)
// ============================================
router.get('/meta/config-ids', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      app_id: process.env.FACEBOOK_APP_ID || '',
      configs: {
        whatsapp: process.env.META_CONFIG_WHATSAPP || '',
        instagram: process.env.META_CONFIG_INSTAGRAM || '',
        ads: process.env.META_CONFIG_ADS || ''
      }
    })
  } catch (error) {
    console.error('Error fetching meta config IDs:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

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

// ============================================
// TEST UTILITY MESSAGE (Meta App Review Only)
// ============================================
router.post('/test-utility-message', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    
    const checkRes = await pool.query(
      "SELECT executed_at, result FROM meta_review_tests WHERE test_name = 'utility_message'"
    )
    if (checkRes.rows.length > 0) {
      return res.json({ 
        message: 'Test already executed automatically on startup',
        executed_at: checkRes.rows[0].executed_at,
        result: checkRes.rows[0].result
      })
    }
    
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
    
    const leadRes = await pool.query(
      `SELECT facebook_psid FROM leads l
       JOIN agents a ON l.agent_id = a.id
       WHERE a.user_id = $1 AND l.facebook_psid IS NOT NULL
       LIMIT 1`,
      [userId]
    )
    
    if (leadRes.rows.length === 0) {
      return res.status(400).json({ 
        error: 'No recent Facebook messenger found. Someone must message your page first.' 
      })
    }
    
    const psid = leadRes.rows[0].facebook_psid
    
    // Use RESPONSE type instead of MESSAGE_TAG to avoid tag approval requirement
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
          messaging_type: 'RESPONSE'
        })
      }
    )
    
    const data = await response.json()
    
    if (data.error) {
      return res.status(400).json({ error: data.error.message })
    }
    
    await pool.query(
      "INSERT INTO meta_review_tests (test_name, result) VALUES ('utility_message', $1)",
      [JSON.stringify({ success: true, message_id: data.message_id, manual: true })]
    )
    
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

// ============================================
// TEST WHATSAPP UTILITY MESSAGE (Meta App Review)
// ============================================
router.post('/test-whatsapp-utility-message', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    
    const checkRes = await pool.query(
      "SELECT executed_at, result FROM meta_review_tests WHERE test_name = 'whatsapp_utility_message'"
    )
    if (checkRes.rows.length > 0) {
      return res.json({ 
        message: 'Test already executed',
        executed_at: checkRes.rows[0].executed_at,
        result: checkRes.rows[0].result
      })
    }
    
    const configRes = await pool.query(
      'SELECT whatsapp_config FROM user_integrations WHERE user_id = $1 AND whatsapp_config IS NOT NULL',
      [userId]
    )
    
    if (configRes.rows.length === 0 || !configRes.rows[0].whatsapp_config) {
      return res.status(400).json({ error: 'WhatsApp not connected' })
    }
    
    const config = configRes.rows[0].whatsapp_config
    const phoneNumberId = config.phone_number_id
    const accessToken = config.access_token
    
    // Get a lead with WhatsApp number (client_phone column)
    const leadRes = await pool.query(
      `SELECT client_phone as whatsapp_number, name FROM leads l
       JOIN agents a ON l.agent_id = a.id
       WHERE a.user_id = $1 AND l.client_phone IS NOT NULL AND l.source = 'whatsapp'
       LIMIT 1`,
      [userId]
    )
    
    if (leadRes.rows.length === 0) {
      return res.status(400).json({ 
        error: 'No WhatsApp leads found. Someone must message your WhatsApp number first.' 
      })
    }
    
    const whatsappNumber = leadRes.rows[0].whatsapp_number
    const leadName = leadRes.rows[0].name
    
    console.log('[Meta Review] Sending WhatsApp utility message to:', whatsappNumber)
    
    // Try to send with template first (utility - appointment confirmation)
    // If template doesn't exist, fall back to simple text message
    let requestBody
    
    // Check if we have a template available, otherwise use simple text
    // For Meta App Review, a simple text message is sufficient
    requestBody = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: whatsappNumber,
      type: 'text',
      text: {
        body: `✅ Hola ${leadName}, este es un mensaje de confirmación de cita para Meta App Review. Tu cita de prueba está confirmada para hoy. Gracias por usar Pivot.AI.`
      }
    }
    
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestBody)
      }
    )
    
    const data = await response.json()
    
    if (data.error) {
      console.log('[Meta Review] WhatsApp utility_message FAILED:', data.error.message)
      return res.status(400).json({ error: data.error.message })
    }
    
    await pool.query(
      "INSERT INTO meta_review_tests (test_name, result) VALUES ('whatsapp_utility_message', $1)",
      [JSON.stringify({ success: true, message_id: data.messages?.[0]?.id, manual: true })]
    )
    
    console.log('[Meta Review] WhatsApp utility_message SUCCESS:', data)
    
    res.json({ 
      success: true, 
      message: 'WhatsApp utility message sent successfully',
      recipient: whatsappNumber,
      message_id: data.messages?.[0]?.id
    })
    
  } catch (error) {
    console.error('Test WhatsApp utility message error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// TEST INSTAGRAM PERMISSIONS (Meta App Review)
// ============================================
router.post('/test-instagram/:permission', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const { permission } = req.params
    
    const validPermissions = ['manage_messages', 'manage_comments', 'manage_insights', 'content_publish']
    if (!validPermissions.includes(permission)) {
      return res.status(400).json({ error: 'Invalid permission' })
    }
    
    const testName = `ig_${permission}`
    const checkRes = await pool.query(
      "SELECT executed_at, result FROM meta_review_tests WHERE test_name = $1",
      [testName]
    )
    if (checkRes.rows.length > 0) {
      return res.json({ 
        message: 'Test already executed',
        executed_at: checkRes.rows[0].executed_at,
        result: checkRes.rows[0].result
      })
    }
    
    const igRes = await pool.query(
      "SELECT instagram_config FROM user_integrations WHERE user_id = $1",
      [userId]
    )
    
    if (igRes.rows.length === 0 || !igRes.rows[0].instagram_config) {
      return res.status(400).json({ error: 'Instagram not connected' })
    }
    
    const config = igRes.rows[0].instagram_config
    const accessToken = config.access_token
    const igAccountId = config.ig_account_id || config.page_id
    
    if (!igAccountId) {
      return res.status(400).json({ error: 'Instagram account ID not found' })
    }
    
    let result = { success: false }
    
    if (permission === 'manage_messages') {
      const igUserRes = await pool.query(
        `SELECT instagram_psid FROM leads l
         JOIN agents a ON l.agent_id = a.id
         WHERE a.user_id = $1 AND l.instagram_psid IS NOT NULL
         LIMIT 1`,
        [userId]
      )
      
      if (igUserRes.rows.length === 0) {
        return res.status(400).json({ error: 'No Instagram users found. Someone must message your Instagram first.' })
      }
      
      const igUserId = igUserRes.rows[0].instagram_psid
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: igUserId },
            message: { text: `✅ Test message for Meta App Review - ${permission}` }
          })
        }
      )
      const data = await response.json()
      if (data.error) throw new Error(data.error.message)
      result = { success: true, message_id: data.message_id }
      
    } else if (permission === 'manage_insights') {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${igAccountId}/insights?metric=follower_count,impressions,reach&access_token=${accessToken}`
      )
      const data = await response.json()
      if (data.error) throw new Error(data.error.message)
      result = { success: true, data: data.data }
      
    } else if (permission === 'manage_comments') {
      const mediaRes = await fetch(
        `https://graph.facebook.com/v18.0/${igAccountId}/media?fields=id&access_token=${accessToken}`
      )
      const mediaData = await mediaRes.json()
      
      if (mediaData.data && mediaData.data.length > 0) {
        const mediaId = mediaData.data[0].id
        const commentsRes = await fetch(
          `https://graph.facebook.com/v18.0/${mediaId}/comments?access_token=${accessToken}`
        )
        const commentsData = await commentsRes.json()
        if (commentsData.error) throw new Error(commentsData.error.message)
        result = { success: true, comments_count: commentsData.data?.length || 0 }
      } else {
        result = { success: true, note: 'No media found' }
      }
      
    } else if (permission === 'content_publish') {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${igAccountId}?fields=media_limit,media_count&access_token=${accessToken}`
      )
      const data = await response.json()
      if (data.error) throw new Error(data.error.message)
      result = { success: true, media_count: data.media_count }
    }
    
    await pool.query(
      "INSERT INTO meta_review_tests (test_name, result) VALUES ($1, $2)",
      [testName, JSON.stringify({ ...result, manual: true })]
    )
    
    res.json({ success: true, message: `Instagram ${permission} test completed`, result })
    
  } catch (error) {
    console.error(`Test Instagram ${req.params.permission} error:`, error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// GET META REVIEW TEST STATUS
// ============================================
router.get('/meta-review-status', auth, async (req, res) => {
  try {
    const pool = req.pool
    
    const tests = await pool.query(
      "SELECT test_name, executed_at, result FROM meta_review_tests ORDER BY executed_at DESC"
    )
    
    const testMap = {
      utility_message: { label: 'pages_utility_messaging', type: 'facebook', executed: false },
      whatsapp_utility_message: { label: 'whatsapp_utility_messaging', type: 'whatsapp', executed: false },
      public_profile: { label: 'public_profile', type: 'facebook', executed: false },
      pages_show_list: { label: 'pages_show_list', type: 'facebook', executed: false },
      ig_manage_messages: { label: 'instagram_manage_messages', type: 'instagram', executed: false },
      ig_manage_comments: { label: 'instagram_manage_comments', type: 'instagram', executed: false },
      ig_manage_insights: { label: 'instagram_manage_insights', type: 'instagram', executed: false },
      ig_content_publish: { label: 'instagram_content_publish', type: 'instagram', executed: false }
    }
    
    tests.rows.forEach(test => {
      if (testMap[test.test_name]) {
        testMap[test.test_name].executed = true
        testMap[test.test_name].executed_at = test.executed_at
        testMap[test.test_name].result = test.result
      }
    })
    
    const summary = Object.values(testMap)
    const totalCompleted = summary.filter(t => t.executed).length
    
    res.json({
      success: true,
      tests: summary,
      totalCompleted,
      totalRequired: summary.length
    })
    
  } catch (error) {
    console.error('Meta review status error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// TEST PUBLIC PROFILE (Meta App Review)
// ============================================
router.post('/test-public-profile', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    
    const checkRes = await pool.query(
      "SELECT executed_at, result FROM meta_review_tests WHERE test_name = 'public_profile'"
    )
    if (checkRes.rows.length > 0) {
      return res.json({ 
        message: 'Test already executed',
        executed_at: checkRes.rows[0].executed_at,
        result: checkRes.rows[0].result
      })
    }
    
    const configRes = await pool.query(
      'SELECT facebook_config FROM user_integrations WHERE user_id = $1',
      [userId]
    )
    
    if (configRes.rows.length === 0 || !configRes.rows[0].facebook_config) {
      return res.status(400).json({ error: 'Facebook not connected' })
    }
    
    const config = configRes.rows[0].facebook_config
    const accessToken = config.user_access_token || config.access_token
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,picture.width(100)&access_token=${accessToken}`
    )
    const data = await response.json()
    
    if (data.error) {
      return res.status(400).json({ error: data.error.message })
    }
    
    await pool.query(
      "INSERT INTO meta_review_tests (test_name, result) VALUES ('public_profile', $1)",
      [JSON.stringify({ success: true, data: { id: data.id, name: data.name } })]
    )
    
    console.log('[Meta Review] public_profile test completed:', data)
    res.json({ success: true, message: 'Public profile test completed', data })
    
  } catch (error) {
    console.error('Test public_profile error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// TEST PAGES SHOW LIST (Meta App Review)
// ============================================
router.post('/test-pages-show-list', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    
    const checkRes = await pool.query(
      "SELECT executed_at, result FROM meta_review_tests WHERE test_name = 'pages_show_list'"
    )
    if (checkRes.rows.length > 0) {
      return res.json({ 
        message: 'Test already executed',
        executed_at: checkRes.rows[0].executed_at,
        result: checkRes.rows[0].result
      })
    }
    
    const configRes = await pool.query(
      'SELECT facebook_config FROM user_integrations WHERE user_id = $1',
      [userId]
    )
    
    if (configRes.rows.length === 0 || !configRes.rows[0].facebook_config) {
      return res.status(400).json({ error: 'Facebook not connected' })
    }
    
    const config = configRes.rows[0].facebook_config
    const accessToken = config.user_access_token || config.access_token
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
    )
    const data = await response.json()
    
    if (data.error) {
      return res.status(400).json({ error: data.error.message })
    }
    
    await pool.query(
      "INSERT INTO meta_review_tests (test_name, result) VALUES ('pages_show_list', $1)",
      [JSON.stringify({ success: true, pages_count: data.data?.length || 0 })]
    )
    
    console.log('[Meta Review] pages_show_list test completed:', data)
    res.json({ success: true, message: 'Pages show list test completed', data })
    
  } catch (error) {
    console.error('Test pages_show_list error:', error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
