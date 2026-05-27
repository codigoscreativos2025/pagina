const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const multer = require('multer')
const mediaService = require('../services/mediaService')
const { sendWhatsAppMessage, saveMessage } = require('./webhooks')
const waTemplates = require('../services/whatsappTemplates')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: (parseInt(process.env.MEDIA_MAX_SIZE_MB) || 100) * 1024 * 1024 }
})

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

// Delete lead and all associated messages/media
router.delete('/leads/:id', auth, async (req, res) => {
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

    // Delete associated media files first
    await pool.query('DELETE FROM media_files WHERE lead_id = $1', [leadId])
    // Delete messages
    await pool.query('DELETE FROM messages WHERE lead_id = $1', [leadId])
    // Delete lead tags
    await pool.query('DELETE FROM lead_tags WHERE lead_id = $1', [leadId])
    // Delete lead
    await pool.query('DELETE FROM leads WHERE id = $1', [leadId])

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting lead:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get chat history for a lead (with pagination)
router.get('/leads/:id/messages', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const leadId = req.params.id
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit) || 50))
    const offset = (page - 1) * limit

    // Verify ownership
    const check = await pool.query(`
      SELECT l.id FROM leads l
      JOIN agents a ON l.agent_id = a.id
      WHERE l.id = $1 AND a.user_id = $2
    `, [leadId, userId])

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found or unauthorized' })
    }

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM messages WHERE lead_id = $1', [leadId]
    )
    const total = parseInt(countResult.rows[0].count)

    const result = await pool.query(`
      SELECT m.*, mf.type as media_type, mf.mime_type as media_mime_type, mf.filename as media_filename,
             mf.duration_seconds as media_duration, mf.transcription as media_transcription,
             mf.size_bytes as media_size, mf.storage_path as media_storage_path,
             t.display_name as template_display_name, t.name as template_name, t.category as template_category
      FROM messages m
      LEFT JOIN media_files mf ON m.media_id = mf.id AND mf.deleted_at IS NULL
      LEFT JOIN wa_templates t ON m.template_id = t.id
      WHERE m.lead_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `, [leadId, limit, offset])

    res.json({ 
      success: true, 
      messages: result.rows.reverse(), // Return in ASC order for chat display
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete a single message
router.delete('/leads/:id/messages/:msgId', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const { id: leadId, msgId } = req.params

    const check = await pool.query(`
      SELECT l.id FROM leads l
      JOIN agents a ON l.agent_id = a.id
      WHERE l.id = $1 AND a.user_id = $2
    `, [leadId, userId])

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found or unauthorized' })
    }

    const msgCheck = await pool.query(
      'SELECT id, media_id FROM messages WHERE id = $1 AND lead_id = $2',
      [msgId, leadId]
    )

    if (msgCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' })
    }

    // Soft-delete message
    await pool.query('DELETE FROM messages WHERE id = $1', [msgId])

    res.json({ success: true, message: 'Message deleted' })
  } catch (error) {
    console.error('Error deleting message:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update lead name
router.put('/leads/:id', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const leadId = req.params.id
    const { name } = req.body

    const check = await pool.query(`
      SELECT l.id FROM leads l
      JOIN agents a ON l.agent_id = a.id
      WHERE l.id = $1 AND a.user_id = $2
    `, [leadId, userId])

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found or unauthorized' })
    }

    await pool.query(
      'UPDATE leads SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [name || 'Sin nombre', leadId]
    )

    res.json({ success: true, message: 'Lead updated' })
  } catch (error) {
    console.error('Error updating lead:', error)
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
    const { content, message_type, media_id, template_id } = req.body

    const check = await pool.query(`
      SELECT l.client_phone, l.is_ai_active, l.source, a.whatsapp_config, a.id as agent_id
      FROM leads l
      JOIN agents a ON l.agent_id = a.id
      WHERE l.id = $1 AND a.user_id = $2
    `, [leadId, userId])

    if (check.rows.length === 0) return res.status(404).json({ error: 'Lead not found' })

    const lead = check.rows[0]
    const isWhatsApp = lead.source === 'whatsapp' || !lead.source
    const whatsappConfig = typeof lead.whatsapp_config === 'string' ? JSON.parse(lead.whatsapp_config) : lead.whatsapp_config
    const agentPhoneSanitized = whatsappConfig?.phone?.replace(/\D/g, '') || ''

    if (template_id) {
      const templateResult = await pool.query(
        'SELECT * FROM wa_templates WHERE id = $1 AND user_id = $2 AND status = $3',
        [template_id, userId, 'APPROVED']
      )
      if (!templateResult.rows.length) return res.status(400).json({ error: 'Template not found or not approved' })

      const template = templateResult.rows[0]
      const components = req.body.template_components || []

      const sendResult = await waTemplates.sendTemplateMessage(
        pool, userId, lead.agent_id, template.name, template.language, components, lead.client_phone
      )

      if (!sendResult.success) {
        return res.status(400).json({ error: sendResult.error })
      }

      await saveMessage(pool, leadId, 'agent', template.body_text || template.name, 'template', null, template_id)

      const waMsgId = sendResult.wa_message_id
      if (waMsgId) {
        await pool.query(
          'UPDATE messages SET wa_message_id = $1 WHERE id = (SELECT id FROM messages WHERE lead_id = $2 AND template_id = $3 ORDER BY created_at DESC LIMIT 1)',
          [waMsgId, leadId, template_id]
        )
      }

      await pool.query('UPDATE leads SET is_ai_active = false WHERE id = $1', [leadId])

      return res.json({
        success: true,
        message: { content: template.body_text || template.name, sender_type: 'agent', message_type: 'template', template_id, created_at: new Date() },
        is_ai_active: false
      })
    }

    if (!content && !media_id) {
      return res.status(400).json({ error: 'Content or media_id required' })
    }

    let messageType = message_type || 'text'
    let mediaRecord = null

    if (media_id) {
      const mediaResult = await pool.query(
        'SELECT * FROM media_files WHERE id = $1 AND user_id = $2',
        [media_id, userId]
      )
      if (!mediaResult.rows.length) return res.status(404).json({ error: 'Media not found' })
      mediaRecord = mediaResult.rows[0]
      messageType = mediaRecord.type
    }

    let waMessageId = null

    // Only send via WhatsApp API for WhatsApp leads
    if (isWhatsApp && lead.client_phone) {
      const waResponse = await sendWhatsAppMessage(lead.client_phone, agentPhoneSanitized, content || `[${messageType}]`)
      if (waResponse?.error) {
        console.error('[CRM] WhatsApp send error:', waResponse.error)
      } else if (waResponse?.messages?.[0]?.id) {
        waMessageId = waResponse.messages[0].id
      }
    }

    await saveMessage(pool, leadId, 'agent', content || `[${messageType}]`, messageType, media_id || null)

    if (waMessageId) {
      await pool.query(
        'UPDATE messages SET wa_message_id = $1 WHERE id = (SELECT id FROM messages WHERE lead_id = $2 AND sender_type = $3 ORDER BY created_at DESC LIMIT 1)',
        [waMessageId, leadId, 'agent']
      )
    }

    await pool.query('UPDATE leads SET is_ai_active = false WHERE id = $1', [leadId])

    res.json({
      success: true,
      message: { content: content || `[${messageType}]`, sender_type: 'agent', message_type: messageType, media_id: media_id || null, created_at: new Date() },
      is_ai_active: false
    })
  } catch (error) {
    console.error('Error sending message:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Upload media for a lead conversation
router.post('/leads/:id/media', auth, upload.single('file'), async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const leadId = req.params.id

    if (!req.file) return res.status(400).json({ error: 'No file provided' })

    const check = await pool.query(`
      SELECT l.id FROM leads l
      JOIN agents a ON l.agent_id = a.id
      WHERE l.id = $1 AND a.user_id = $2
    `, [leadId, userId])

    if (check.rows.length === 0) return res.status(404).json({ error: 'Lead not found' })

    const saved = await mediaService.saveLocalFile(userId, {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    })

    const classifiedType = mediaService.classifyMedia(null, req.file.mimetype)
    const expiresAt = await mediaService.calculateExpiration(userId, pool)

    const result = await pool.query(
      `INSERT INTO media_files (user_id, lead_id, direction, type, mime_type, filename, size_bytes, storage_path, expires_at)
       VALUES ($1, $2, 'outbound', $3, $4, $5, $6, $7, $8) RETURNING *`,
      [userId, leadId, classifiedType, req.file.mimetype, saved.filename, saved.size_bytes, saved.storage_path, expiresAt]
    )

    const media = result.rows[0]
    const host = `${req.protocol}://${req.get('host')}`
    const url = mediaService.getSignedUrl(media.id, host)

    res.status(201).json({ success: true, media: { ...media, url } })
  } catch (error) {
    console.error('Error uploading media:', error)
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

// ============================================
// AI SUGGESTION: Suggest stage change for lead
// ============================================
router.get('/leads/:id/suggestion', auth, async (req, res) => {
  try {
    const pool = req.pool
    const leadId = req.params.id

    // Get lead and recent messages
    const leadRes = await pool.query(
      `SELECT l.*, a.user_id FROM leads l
       JOIN agents a ON l.agent_id = a.id
       WHERE l.id = $1`,
      [leadId]
    )
    if (leadRes.rows.length === 0) return res.json({ success: false })

    const lead = leadRes.rows[0]
    const messagesRes = await pool.query(
      'SELECT content, sender_type FROM messages WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 10',
      [leadId]
    )
    const messages = messagesRes.rows

    // Simple keyword-based suggestion logic
    const allText = messages.map(m => m.content).join(' ').toLowerCase()
    const buyKeywords = ['compro', 'comprar', 'me interesa', 'quiero', 'precio', 'costo', 'contratar', 'reservar', 'agendar', 'cita']
    const hasBuyIntent = buyKeywords.some(kw => allText.includes(kw))

    // Get stages for this user
    const stagesRes = await pool.query(
      `SELECT s.* FROM stages s
       JOIN funnels f ON s.funnel_id = f.id
       WHERE f.user_id = $1
       ORDER BY s.order_index`,
      [lead.user_id]
    )
    const stages = stagesRes.rows

    // Find appropriate stage
    let suggestedStageId = null
    let suggestedStageName = ''
    let suggestionMessage = ''

    if (hasBuyIntent && lead.stage_id) {
      // Suggest moving to "Propuesta" or equivalent
      const proposalStage = stages.find(s =>
        s.name.toLowerCase().includes('propuesta') ||
        s.name.toLowerCase().includes('conversación') ||
        s.name.toLowerCase().includes('contactado')
      )
      if (proposalStage && proposalStage.id !== lead.stage_id) {
        suggestedStageId = proposalStage.id
        suggestedStageName = proposalStage.name
        suggestionMessage = 'Este lead muestra interés de compra. ¿Mover a esta etapa?'
      }
    }

    if (!suggestedStageId) {
      return res.json({ success: false })
    }

    res.json({
      success: true,
      suggestion: {
        message: suggestionMessage,
        suggested_stage_id: suggestedStageId,
        suggested_stage_name: suggestedStageName
      }
    })
  } catch (error) {
    console.error('AI suggestion error:', error)
    res.json({ success: false })
  }
})
