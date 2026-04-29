const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { name, business_info, system_prompt, ai_config, whatsapp_config, google_sheets_config } = req.body;
    
    const userPlan = await req.pool.query(
      'SELECT p.* FROM users u LEFT JOIN plans p ON u.plan_id = p.id WHERE u.id = $1',
      [req.user.id]
    );
    
    const existingAgent = await req.pool.query(
      'SELECT id FROM agents WHERE user_id = $1',
      [req.user.id]
    );
    
    if (existingAgent.rows.length > 0) {
      const result = await req.pool.query(
        `UPDATE agents SET 
          name = $1, business_info = $2, system_prompt = $3, 
          ai_config = $4, whatsapp_config = $5, google_sheets_config = $6,
          updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $7
         RETURNING *`,
        [name, JSON.stringify(business_info), system_prompt, 
         JSON.stringify(ai_config), JSON.stringify(whatsapp_config), 
         JSON.stringify(google_sheets_config), req.user.id]
      );
      return res.json(result.rows[0]);
    }
    
    const result = await req.pool.query(
      `INSERT INTO agents (user_id, name, business_info, system_prompt, ai_config, whatsapp_config, google_sheets_config)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, name, JSON.stringify(business_info), system_prompt,
       JSON.stringify(ai_config), JSON.stringify(whatsapp_config),
       JSON.stringify(google_sheets_config)]
    );
    
    res.json(result.rows[0]);
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
    const { name, business_info, system_prompt, ai_config, whatsapp_config, google_sheets_config, is_active } = req.body;
    
    const result = await req.pool.query(
      `UPDATE agents SET 
        name = COALESCE($1, name),
        business_info = COALESCE($2, business_info),
        system_prompt = COALESCE($3, system_prompt),
        ai_config = COALESCE($4, ai_config),
        whatsapp_config = COALESCE($5, whatsapp_config),
        google_sheets_config = COALESCE($6, google_sheets_config),
        is_active = COALESCE($7, is_active),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [name, business_info ? JSON.stringify(business_info) : null,
       system_prompt, ai_config ? JSON.stringify(ai_config) : null,
       whatsapp_config ? JSON.stringify(whatsapp_config) : null,
       google_sheets_config ? JSON.stringify(google_sheets_config) : null,
       is_active, req.params.id, req.user.id]
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

module.exports = router;
