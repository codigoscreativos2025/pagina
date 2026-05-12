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
      SELECT m.*, mf.type as media_type, mf.mime_type as media_mime_type, mf.filename as media_filename,
             mf.duration_seconds as media_duration, mf.transcription as media_transcription,
             t.display_name as template_display_name, t.name as template_name, t.category as template_category
      FROM messages m
      LEFT JOIN media_files mf ON m.media_id = mf.id AND mf.deleted_at IS NULL
      LEFT JOIN wa_templates t ON m.template_id = t.id
      WHERE m.lead_id = $1
      ORDER BY m.created_at ASC
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
    const { content, message_type, media_id, template_id } = req.body

    const check = await pool.query(`
      SELECT l.client_phone, l.is_ai_active, a.whatsapp_config, a.id as agent_id
      FROM leads l
      JOIN agents a ON l.agent_id = a.id
      WHERE l.id = $1 AND a.user_id = $2
    `, [leadId, userId])

    if (check.rows.length === 0) return res.status(404).json({ error: 'Lead not found' })

    const lead = check.rows[0]
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
        await pool.query('UPDATE messages SET wa_message_id = $1 WHERE lead_id = $2 AND template_id = $3 ORDER BY created_at DESC LIMIT 1', [waMsgId, leadId, template_id])
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

    const waResponse = await sendWhatsAppMessage(lead.client_phone, agentPhoneSanitized, content || `[${messageType}]`)
    if (waResponse?.error) {
      return res.status(400).json({ error: 'Meta API Error', details: waResponse.error })
    }

    await saveMessage(pool, leadId, 'agent', content || `[${messageType}]`, messageType, media_id || null)

    if (waResponse?.messages?.[0]?.id) {
      await pool.query(
        'UPDATE messages SET wa_message_id = $1 WHERE lead_id = $2 AND sender_type = $3 ORDER BY created_at DESC LIMIT 1',
        [waResponse.messages[0].id, leadId, 'agent']
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
