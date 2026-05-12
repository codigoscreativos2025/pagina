const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const planFeature = require('../middleware/planFeatures');
const waTemplates = require('../services/whatsappTemplates');

router.get('/', auth, async (req, res) => {
  try {
    const result = await req.pool.query(
      `SELECT t.*, 
        (SELECT json_agg(json_build_object('agent_id', at.agent_id, 'usage_context', at.usage_context, 'enabled', at.enabled))
         FROM agent_templates at WHERE at.template_id = t.id) as agent_assignments
       FROM wa_templates t
       WHERE t.user_id = $1
       ORDER BY t.updated_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, templates: result.rows });
  } catch (error) {
    console.error('[Templates] List error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await req.pool.query(
      `SELECT t.*,
        (SELECT json_agg(json_build_object('agent_id', at.agent_id, 'usage_context', at.usage_context, 'enabled', at.enabled))
         FROM agent_templates at WHERE at.template_id = t.id) as agent_assignments
       FROM wa_templates t
       WHERE t.id = $1 AND t.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Template not found' });
    res.json({ success: true, template: result.rows[0] });
  } catch (error) {
    console.error('[Templates] Get error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', auth, planFeature('wa_templates_enabled'), async (req, res) => {
  try {
    const { name, display_name, language, category, components, body_text, variables_count } = req.body;

    if (!name || !category || !components) {
      return res.status(400).json({ error: 'name, category, and components are required' });
    }

    const validCategories = ['UTILITY', 'MARKETING', 'AUTHENTICATION'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
    }

    const result = await req.pool.query(
      `INSERT INTO wa_templates (user_id, name, display_name, language, category, components, body_text, variables_count, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'DRAFT') RETURNING *`,
      [req.user.id, name, display_name || name, language || 'es', category,
       JSON.stringify(components), body_text || '', variables_count || 0]
    );

    res.status(201).json({ success: true, template: result.rows[0] });
  } catch (error) {
    console.error('[Templates] Create error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Template name already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, display_name, language, category, components, body_text, variables_count } = req.body;

    const existing = await req.pool.query(
      'SELECT status FROM wa_templates WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!existing.rows.length) return res.status(404).json({ error: 'Template not found' });

    const result = await req.pool.query(
      `UPDATE wa_templates SET
        name = COALESCE($1, name),
        display_name = COALESCE($2, display_name),
        language = COALESCE($3, language),
        category = COALESCE($4, category),
        components = COALESCE($5, components),
        body_text = COALESCE($6, body_text),
        variables_count = COALESCE($7, variables_count),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND user_id = $9 RETURNING *`,
      [name, display_name, language, category,
       components ? JSON.stringify(components) : null,
       body_text, variables_count, req.params.id, req.user.id]
    );

    res.json({ success: true, template: result.rows[0] });
  } catch (error) {
    console.error('[Templates] Update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/submit', auth, planFeature('wa_templates_enabled'), async (req, res) => {
  try {
    const templateResult = await req.pool.query(
      'SELECT * FROM wa_templates WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!templateResult.rows.length) return res.status(404).json({ error: 'Template not found' });

    const template = templateResult.rows[0];
    if (template.status === 'APPROVED') {
      return res.status(400).json({ error: 'Template already approved' });
    }

    const submitResult = await waTemplates.submitTemplate(req.pool, req.user.id, {
      name: template.name,
      language: template.language,
      category: template.category,
      components: typeof template.components === 'string' ? JSON.parse(template.components) : template.components,
      body_text: template.body_text,
      display_name: template.display_name
    });

    if (!submitResult.success) {
      return res.status(400).json({ error: submitResult.error, meta_error: submitResult.meta_error });
    }

    await req.pool.query(
      `UPDATE wa_templates SET status = $1, meta_template_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [submitResult.status || 'PENDING', submitResult.meta_template_id, template.id]
    );

    res.json({ success: true, status: submitResult.status || 'PENDING', meta_template_id: submitResult.meta_template_id });
  } catch (error) {
    console.error('[Templates] Submit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/sync', auth, async (req, res) => {
  try {
    const existing = await req.pool.query(
      'SELECT * FROM wa_templates WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!existing.rows.length) return res.status(404).json({ error: 'Template not found' });

    const result = await waTemplates.syncTemplateStatus(req.pool, req.user.id, req.params.id);
    if (!result.success) return res.status(400).json({ error: result.error });

    res.json({ success: true, status: result.status, rejection_reason: result.rejection_reason });
  } catch (error) {
    console.error('[Templates] Sync error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/sync-all', auth, async (req, res) => {
  try {
    const result = await waTemplates.syncAllTemplates(req.pool, req.user.id);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ success: true, synced: result.synced });
  } catch (error) {
    console.error('[Templates] Sync-all error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const existing = await req.pool.query(
      'SELECT * FROM wa_templates WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!existing.rows.length) return res.status(404).json({ error: 'Template not found' });

    const template = existing.rows[0];

    if (template.meta_template_id && template.status !== 'DRAFT') {
      const result = await waTemplates.deleteTemplate(req.pool, req.user.id, req.params.id);
      if (!result.success) return res.status(400).json({ error: result.error });
    } else {
      await req.pool.query('DELETE FROM agent_templates WHERE template_id = $1', [req.params.id]);
      await req.pool.query('DELETE FROM wa_templates WHERE id = $1', [req.params.id]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Templates] Delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/send', auth, planFeature('wa_templates_enabled'), async (req, res) => {
  try {
    const { template_id, lead_id, components, agent_id } = req.body;

    if (!template_id || !lead_id) {
      return res.status(400).json({ error: 'template_id and lead_id are required' });
    }

    const templateResult = await req.pool.query(
      'SELECT * FROM wa_templates WHERE id = $1 AND user_id = $2',
      [template_id, req.user.id]
    );
    if (!templateResult.rows.length) return res.status(404).json({ error: 'Template not found' });

    const template = templateResult.rows[0];
    if (template.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Template must be APPROVED before sending' });
    }

    const leadResult = await req.pool.query(
      `SELECT l.*, a.id as agent_id, a.user_id as agent_user_id
       FROM leads l JOIN agents a ON l.agent_id = a.id
       WHERE l.id = $1 AND a.user_id = $2`,
      [lead_id, req.user.id]
    );
    if (!leadResult.rows.length) return res.status(404).json({ error: 'Lead not found' });

    const lead = leadResult.rows[0];
    const sendResult = await waTemplates.sendTemplateMessage(
      req.pool, req.user.id, agent_id || lead.agent_id,
      template.name, template.language, components, lead.client_phone
    );

    if (!sendResult.success) {
      return res.status(400).json({ error: sendResult.error });
    }

    await req.pool.query(
      `INSERT INTO messages (lead_id, sender_type, content, message_type, template_id, wa_message_id, status)
       VALUES ($1, 'agent', $2, 'template', $3, $4, 'sent')`,
      [lead_id, template.body_text || template.name, template_id, sendResult.wa_message_id]
    );

    await req.pool.query('UPDATE leads SET is_ai_active = false WHERE id = $1', [lead_id]);

    res.json({ success: true, wa_message_id: sendResult.wa_message_id });
  } catch (error) {
    console.error('[Templates] Send error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;