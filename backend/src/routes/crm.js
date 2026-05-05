const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { sendWhatsAppMessage, saveMessage } = require('./webhooks')

// Get all leads for the current user's agents
router.get('/leads', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id

    const result = await pool.query(`
      SELECT l.*, a.name as agent_name 
      FROM leads l
      JOIN agents a ON l.agent_id = a.id
      WHERE a.user_id = $1
      ORDER BY l.updated_at DESC
    `, [userId])

    res.json({ success: true, leads: result.rows })
  } catch (error) {
    console.error('Error fetching leads:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update lead status
router.put('/leads/:id/status', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const leadId = req.params.id
    const { status } = req.body

    // Verify ownership
    const check = await pool.query(`
      SELECT l.id FROM leads l
      JOIN agents a ON l.agent_id = a.id
      WHERE l.id = $1 AND a.user_id = $2
    `, [leadId, userId])

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found or unauthorized' })
    }

    await pool.query(`
      UPDATE leads 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `, [status, leadId])

    res.json({ success: true })
  } catch (error) {
    console.error('Error updating lead status:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get chat history for a lead
router.get('/leads/:id/messages', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const leadId = req.params.id

    // Verify ownership
    const check = await pool.query(`
      SELECT l.id FROM leads l
      JOIN agents a ON l.agent_id = a.id
      WHERE l.id = $1 AND a.user_id = $2
    `, [leadId, userId])

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found or unauthorized' })
    }

    const result = await pool.query(`
      SELECT * FROM messages
      WHERE lead_id = $1
      ORDER BY created_at ASC
    `, [leadId])

    res.json({ success: true, messages: result.rows })
  } catch (error) {
    console.error('Error fetching messages:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Toggle AI Status
router.put('/leads/:id/ai_status', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const leadId = req.params.id
    const { is_ai_active } = req.body

    const check = await pool.query(`
      SELECT l.id FROM leads l
      JOIN agents a ON l.agent_id = a.id
      WHERE l.id = $1 AND a.user_id = $2
    `, [leadId, userId])

    if (check.rows.length === 0) return res.status(404).json({ error: 'Lead not found' })

    await pool.query('UPDATE leads SET is_ai_active = $1 WHERE id = $2', [is_ai_active, leadId])
    res.json({ success: true })
  } catch (error) {
    console.error('Error toggling AI:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Send manual message
router.post('/leads/:id/messages', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const leadId = req.params.id
    const { content } = req.body

    const check = await pool.query(`
      SELECT l.client_phone, a.whatsapp_config->>'phone' as agent_phone 
      FROM leads l
      JOIN agents a ON l.agent_id = a.id
      WHERE l.id = $1 AND a.user_id = $2
    `, [leadId, userId])

    if (check.rows.length === 0) return res.status(404).json({ error: 'Lead not found' })

    const lead = check.rows[0]
    const agentPhoneSanitized = lead.agent_phone.replace(/\D/g, '')

    // 1. Send via WhatsApp API
    const waResponse = await sendWhatsAppMessage(lead.client_phone, agentPhoneSanitized, content)
    if (waResponse?.error) {
      return res.status(400).json({ error: 'Meta API Error', details: waResponse.error })
    }

    // 2. Save message to DB
    await saveMessage(pool, leadId, 'agent', content)

    // 3. Disable AI automatically
    await pool.query('UPDATE leads SET is_ai_active = false WHERE id = $1', [leadId])

    res.json({ success: true, message: { content, sender_type: 'agent', created_at: new Date() }, is_ai_active: false })
  } catch (error) {
    console.error('Error sending manual message:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
