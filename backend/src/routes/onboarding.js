const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { getTemplateById, generateSystemPrompt } = require('../data/agentTemplates')

// ============================================
// POST: Complete onboarding wizard
// Creates agent + funnel + optional channel connection
// ============================================
router.post('/complete', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const {
      business_name,
      industry,
      agent_name,
      business_info,
      channel,
      channel_config
    } = req.body

    if (!business_name || !industry) {
      return res.status(400).json({ error: 'Nombre del negocio e industria son requeridos' })
    }

    // Get template for industry
    const template = getTemplateById(industry)
    if (!template) {
      return res.status(400).json({ error: 'Industria no válida' })
    }

    // Generate system prompt
    const systemPrompt = generateSystemPrompt(industry, business_info, agent_name || `${business_name} Asistente`)

    // Create agent
    const agentResult = await pool.query(
      `INSERT INTO agents (user_id, name, business_info, system_prompt, ai_config, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [
        userId,
        agent_name || `${business_name} Asistente`,
        JSON.stringify({ industry, ...business_info, business_name }),
        systemPrompt,
        JSON.stringify({}),
      ]
    )

    const agent = agentResult.rows[0]

    // Create funnel with stages from template
    const funnelResult = await pool.query(
      'INSERT INTO funnels (user_id, name) VALUES ($1, $2) RETURNING *',
      [userId, template.funnel.name]
    )
    const funnel = funnelResult.rows[0]

    // Create stages
    for (const stage of template.funnel.stages) {
      await pool.query(
        `INSERT INTO stages (funnel_id, name, color, ai_enabled, order_index)
         VALUES ($1, $2, $3, $4, $5)`,
        [funnel.id, stage.name, stage.color, stage.ai_enabled, stage.order_index]
      )
    }

    // If channel provided, connect it
    if (channel && channel_config) {
      const channelColumn = `${channel}_config`
      const allowedChannels = ['whatsapp', 'instagram', 'facebook', 'tiktok']
      if (allowedChannels.includes(channel)) {
        const intCheck = await pool.query('SELECT user_id FROM user_integrations WHERE user_id = $1', [userId])
        if (intCheck.rows.length === 0) {
          await pool.query(
            `INSERT INTO user_integrations (user_id, ${channelColumn}) VALUES ($1, $2)`,
            [userId, JSON.stringify(channel_config)]
          )
        } else {
          await pool.query(
            `UPDATE user_integrations SET ${channelColumn} = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
            [JSON.stringify(channel_config), userId]
          )
        }

        // For WhatsApp, also sync to agents table
        if (channel === 'whatsapp') {
          await pool.query(
            'UPDATE agents SET whatsapp_config = $1 WHERE id = $2',
            [JSON.stringify(channel_config), agent.id]
          )
        }
      }
    }

    // Mark onboarding as completed (store in user metadata or just check agent count)
    console.log(`[Onboarding] User ${userId} completed onboarding: ${business_name} (${industry})`)

    res.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        funnel_id: funnel.id
      }
    })
  } catch (error) {
    console.error('[Onboarding Error]:', error)
    res.status(500).json({ error: 'Error completando el onboarding' })
  }
})

// ============================================
// GET: Get available templates
// ============================================
router.get('/templates', auth, (req, res) => {
  const templates = require('../data/agentTemplates').getAllTemplates()
  res.json({
    success: true,
    templates: templates.map(t => ({
      id: t.id,
      name: t.name,
      icon: t.icon,
      description: t.description,
      suggestedIntegrations: t.suggestedIntegrations
    }))
  })
})

// ============================================
// GET: Get specific template details
// ============================================
router.get('/templates/:id', auth, (req, res) => {
  const template = require('../data/agentTemplates').getTemplateById(req.params.id)
  if (!template) {
    return res.status(404).json({ error: 'Template not found' })
  }
  res.json({ success: true, template })
})

module.exports = router
