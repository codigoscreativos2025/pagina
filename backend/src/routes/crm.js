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
      SELECT l.*, a.name as agent_name,
        (
          SELECT json_agg(t.*)
          FROM lead_tags lt
          JOIN tags t ON lt.tag_id = t.id
          WHERE lt.lead_id = l.id
        ) as tags
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

// Update lead stage
router.put('/leads/:id/stage', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const leadId = req.params.id
    const { stage_id } = req.body

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
      SET stage_id = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `, [stage_id, leadId])

    const stageCheck = await pool.query('SELECT ai_enabled FROM stages WHERE id = $1', [stage_id])
    let aiDisabled = false
    if (stageCheck.rows.length > 0 && !stageCheck.rows[0].ai_enabled) {
      await pool.query('UPDATE leads SET is_ai_active = false WHERE id = $1', [leadId])
      aiDisabled = true
    }

    res.json({ success: true, aiDisabled })
  } catch (error) {
    console.error('Error updating lead stage:', error)
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

// Manage Tags for Lead
router.post('/leads/:id/tags', auth, async (req, res) => {
  try {
    const pool = req.pool
    const { tag_id } = req.body
    await pool.query('INSERT INTO lead_tags (lead_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.params.id, tag_id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/leads/:id/tags/:tagId', auth, async (req, res) => {
  try {
    const pool = req.pool
    await pool.query('DELETE FROM lead_tags WHERE lead_id = $1 AND tag_id = $2', [req.params.id, req.params.tagId])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
