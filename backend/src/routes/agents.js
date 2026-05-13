const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { name, business_info, system_prompt, ai_config, permissions } = req.body;
    
    const result = await req.pool.query(
      `INSERT INTO agents (user_id, name, business_info, system_prompt, ai_config, permissions)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, name || 'Nuevo Agente', JSON.stringify(business_info || {}), system_prompt || '',
       JSON.stringify(ai_config || {}), JSON.stringify(permissions || [])]
    );
    
    const agent = result.rows[0];

    // Auto-create default funnel with stages for this user
    const existingFunnel = await req.pool.query('SELECT id FROM funnels WHERE user_id = $1 LIMIT 1', [req.user.id]);
    if (existingFunnel.rows.length === 0) {
      const funnelResult = await req.pool.query(
        'INSERT INTO funnels (user_id, name) VALUES ($1, $2) RETURNING *',
        [req.user.id, 'Embudo de Ventas']
      );
      const funnelId = funnelResult.rows[0].id;
      
      await req.pool.query(`
        INSERT INTO stages (funnel_id, name, color, ai_enabled, order_index) VALUES 
        ($1, 'Nuevo', 'bg-blue-100 text-blue-800', true, 0),
        ($1, 'En conversación', 'bg-yellow-100 text-yellow-800', true, 1),
        ($1, 'Propuesta', 'bg-purple-100 text-purple-800', true, 2),
        ($1, 'Convertido', 'bg-green-100 text-green-800', false, 3),
        ($1, 'Perdido', 'bg-red-100 text-red-800', false, 4)
      `, [funnelId]);
    }
    
    res.json(agent);
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const result = await req.pool.query(
      'SELECT * FROM agents WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ error: 'Failed to get agents' });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const redis = req.redis;
    const userId = req.user.id;
    
    const messagesKey = `user:${userId}:messages`;
    const messages = await redis.get(messagesKey) || 0;
    
    const agent = await req.pool.query(
      'SELECT is_active, created_at FROM agents WHERE user_id = $1',
      [userId]
    );
    
    res.json({
      messages: parseInt(messages),
      conversations: Math.floor(parseInt(messages) / 2),
      active: agent.rows.length > 0 && agent.rows[0].is_active
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.json({ messages: 0, conversations: 0, active: false });
  }
});

// Get Google OAuth token for Picker API (MUST be before /:id)
router.get('/google-picker-token', auth, async (req, res) => {
  try {
    const result = await req.pool.query(
      'SELECT google_config FROM user_integrations WHERE user_id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0 || !result.rows[0].google_config) {
      return res.status(400).json({ error: 'Google no conectado' });
    }
    const config = typeof result.rows[0].google_config === 'string'
      ? JSON.parse(result.rows[0].google_config)
      : result.rows[0].google_config;

    // Try to refresh, fallback to stored token
    let accessToken = config.access_token;
    try {
      const { google } = require('googleapis');
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
      oauth2Client.setCredentials({
        access_token: config.access_token,
        refresh_token: config.refresh_token,
        expiry_date: config.expiry_date
      });
      const tokenRes = await oauth2Client.getAccessToken();
      if (tokenRes?.token) accessToken = tokenRes.token;
      else if (tokenRes?.credentials?.access_token) accessToken = tokenRes.credentials.access_token;
    } catch (refreshErr) {
      console.log('Token refresh failed, using stored token');
    }

    if (!accessToken) {
      return res.status(400).json({ error: 'No se pudo obtener token de Google' });
    }

    res.json({
      success: true,
      access_token: accessToken,
      client_id: process.env.GOOGLE_CLIENT_ID
    });
  } catch (error) {
    console.error('Google picker token error:', error);
    res.status(500).json({ error: 'Failed to get Google token' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await req.pool.query(
      'SELECT * FROM agents WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({ error: 'Failed to get agent' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, business_info, system_prompt, ai_config, is_active, permissions, model_id } = req.body;
    
    const result = await req.pool.query(
      `UPDATE agents SET 
        name = COALESCE($1, name),
        business_info = COALESCE($2, business_info),
        system_prompt = COALESCE($3, system_prompt),
        ai_config = COALESCE($4, ai_config),
        is_active = COALESCE($5, is_active),
        permissions = COALESCE($6, permissions),
        model_id = COALESCE($7, model_id),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [name, business_info ? JSON.stringify(business_info) : null,
       system_prompt, ai_config ? JSON.stringify(ai_config) : null,
       is_active, permissions ? JSON.stringify(permissions) : null, 
       model_id, req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

router.post('/test-prompt', auth, async (req, res) => {
  try {
    const { system_prompt, test_message } = req.body;
    
    const agent = await req.pool.query(
      'SELECT * FROM agents WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );
    
    if (agent.rows.length === 0) {
      return res.status(404).json({ error: 'No agent found' });
    }
    
    const openclawResponse = await fetch(process.env.OPENCLAW_URL + '/api/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENCLAW_GATEWAY_TOKEN}`
      },
      body: JSON.stringify({
        session: `test_${req.user.id}`,
        message: test_message,
        context: {
          systemPrompt: system_prompt || agent.rows[0].system_prompt
        }
      })
    });
    
    const data = await openclawResponse.json();
    res.json({ response: data.response || 'Respuesta de prueba' });
  } catch (error) {
    console.error('Test prompt error:', error);
    res.json({ response: 'Error connecting to AI. Using mock response for testing.' });
  }
});

// Delete agent
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await req.pool.query(
      'DELETE FROM agents WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json({ success: true, deleted: result.rows[0].id });
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

module.exports = router;

// Template assignment endpoints for agents
router.get('/:id/templates', auth, async (req, res) => {
  try {
    const agentId = req.params.id;
    const userId = req.user.id;

    const agentCheck = await req.pool.query('SELECT id FROM agents WHERE id = $1 AND user_id = $2', [agentId, userId]);
    if (agentCheck.rows.length === 0) return res.status(404).json({ error: 'Agent not found' });

    const result = await req.pool.query(
      `SELECT at.*, t.name as template_name, t.display_name, t.language, t.category, t.status as template_status, t.body_text, t.components
       FROM agent_templates at
       JOIN wa_templates t ON at.template_id = t.id
       WHERE at.agent_id = $1 AND at.enabled = true`,
      [agentId]
    );

    res.json({ success: true, assignments: result.rows });
  } catch (error) {
    console.error('Get agent templates error:', error);
    res.status(500).json({ error: 'Failed to get agent templates' });
  }
});

router.post('/:id/templates', auth, async (req, res) => {
  try {
    const agentId = req.params.id;
    const userId = req.user.id;
    const { template_id, usage_context, enabled } = req.body;

    if (!template_id) return res.status(400).json({ error: 'template_id is required' });

    const agentCheck = await req.pool.query('SELECT id FROM agents WHERE id = $1 AND user_id = $2', [agentId, userId]);
    if (agentCheck.rows.length === 0) return res.status(404).json({ error: 'Agent not found' });

    const templateCheck = await req.pool.query('SELECT id FROM wa_templates WHERE id = $1 AND user_id = $2', [template_id, userId]);
    if (templateCheck.rows.length === 0) return res.status(404).json({ error: 'Template not found' });

    await req.pool.query(
      `INSERT INTO agent_templates (agent_id, template_id, usage_context, enabled)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (agent_id, template_id) DO UPDATE SET usage_context = $3, enabled = $4`,
      [agentId, template_id, usage_context || null, enabled !== false]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Assign template error:', error);
    res.status(500).json({ error: 'Failed to assign template' });
  }
});

router.delete('/:id/templates/:templateId', auth, async (req, res) => {
  try {
    const agentId = req.params.id;
    const templateId = req.params.templateId;
    const userId = req.user.id;

    const agentCheck = await req.pool.query('SELECT id FROM agents WHERE id = $1 AND user_id = $2', [agentId, userId]);
    if (agentCheck.rows.length === 0) return res.status(404).json({ error: 'Agent not found' });

    await req.pool.query(
      'DELETE FROM agent_templates WHERE agent_id = $1 AND template_id = $2',
      [agentId, templateId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Remove template error:', error);
    res.status(500).json({ error: 'Failed to remove template' });
  }
});

// Active funnels/stages endpoints
router.put('/:id/active-funnels', auth, async (req, res) => {
  try {
    const agentId = req.params.id;
    const userId = req.user.id;
    const { active_funnels } = req.body;

    const agentCheck = await req.pool.query('SELECT id FROM agents WHERE id = $1 AND user_id = $2', [agentId, userId]);
    if (agentCheck.rows.length === 0) return res.status(404).json({ error: 'Agent not found' });

    await req.pool.query(
      'UPDATE agents SET active_funnels = $1 WHERE id = $2',
      [JSON.stringify(active_funnels || []), agentId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Update active funnels error:', error);
    res.status(500).json({ error: 'Failed to update active funnels' });
  }
});

router.get('/:id/active-funnels', auth, async (req, res) => {
  try {
    const agentId = req.params.id;
    const userId = req.user.id;

    const agentCheck = await req.pool.query('SELECT id, active_funnels FROM agents WHERE id = $1 AND user_id = $2', [agentId, userId]);
    if (agentCheck.rows.length === 0) return res.status(404).json({ error: 'Agent not found' });

    const activeFunnels = agentCheck.rows[0].active_funnels || [];
    res.json({ success: true, active_funnels: typeof activeFunnels === 'string' ? JSON.parse(activeFunnels) : activeFunnels });
  } catch (error) {
    console.error('Get active funnels error:', error);
    res.status(500).json({ error: 'Failed to get active funnels' });
  }
});
