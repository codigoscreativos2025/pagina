const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
});

// ============ STATS ============
router.get('/stats', auth, async (req, res) => {
  try {
    const [totalUsers, activeUsers, totalAgents, activeAgents, totalLeads, totalMessages, revenue, newUsersWeek] = await Promise.all([
      req.pool.query('SELECT COUNT(*) FROM users'),
      req.pool.query('SELECT COUNT(*) FROM users WHERE is_active = true'),
      req.pool.query('SELECT COUNT(*) FROM agents'),
      req.pool.query('SELECT COUNT(*) FROM agents WHERE is_active = true'),
      req.pool.query('SELECT COUNT(*) FROM leads'),
      req.pool.query('SELECT COUNT(*) FROM messages'),
      req.pool.query(`SELECT COALESCE(SUM(p.price),0) as total FROM users u LEFT JOIN plans p ON u.plan_id = p.id WHERE u.is_active = true`),
      req.pool.query(`SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days'`)
    ]);
    res.json({
      total_users: parseInt(totalUsers.rows[0].count),
      active_users: parseInt(activeUsers.rows[0].count),
      total_agents: parseInt(totalAgents.rows[0].count),
      active_agents: parseInt(activeAgents.rows[0].count),
      total_leads: parseInt(totalLeads.rows[0].count),
      total_messages: parseInt(totalMessages.rows[0].count),
      monthly_revenue: parseFloat(revenue.rows[0].total) || 0,
      new_users_week: parseInt(newUsersWeek.rows[0].count)
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ============ USERS ============
router.get('/users', auth, async (req, res) => {
  try {
    const result = await req.pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.plan_id, u.is_active, u.created_at,
              p.name as plan_name, p.price,
              (SELECT COUNT(*) FROM agents WHERE user_id = u.id) as agents_count,
              (SELECT COUNT(*) FROM leads l JOIN agents a ON l.agent_id = a.id WHERE a.user_id = u.id) as leads_count
       FROM users u LEFT JOIN plans p ON u.plan_id = p.id
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

router.put('/users/:id', auth, async (req, res) => {
  try {
    const { is_active } = req.body;
    await req.pool.query('UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [is_active, req.params.id]);
    if (!is_active) await req.pool.query('UPDATE agents SET is_active = false WHERE user_id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ============ AI MODELS ============
router.get('/models', auth, async (req, res) => {
  try {
    const result = await req.pool.query('SELECT * FROM ai_models ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get models' });
  }
});

router.post('/models', auth, async (req, res) => {
  try {
    const { name, api_model, api_provider } = req.body;
    const result = await req.pool.query(
      'INSERT INTO ai_models (name, api_model, api_provider) VALUES ($1, $2, $3) RETURNING *',
      [name, api_model, api_provider || 'openai']
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create model' });
  }
});

router.put('/models/:id', auth, async (req, res) => {
  try {
    const { name, api_model, api_provider, is_active } = req.body;
    const result = await req.pool.query(
      'UPDATE ai_models SET name = COALESCE($1,name), api_model = COALESCE($2,api_model), api_provider = COALESCE($3,api_provider), is_active = COALESCE($4,is_active) WHERE id = $5 RETURNING *',
      [name, api_model, api_provider, is_active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update model' });
  }
});

router.delete('/models/:id', auth, async (req, res) => {
  try {
    await req.pool.query('DELETE FROM ai_models WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete model' });
  }
});

// ============ PLAN FEATURES ============
router.get('/plans', auth, async (req, res) => {
  try {
    const result = await req.pool.query('SELECT * FROM plans ORDER BY price ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Admin get plans error:', error);
    res.status(500).json({ error: 'Failed to get plans' });
  }
});

router.put('/plans/:id/features', auth, async (req, res) => {
  try {
    const { features } = req.body;
    if (!features || typeof features !== 'object') {
      return res.status(400).json({ error: 'features must be an object' });
    }

    const result = await req.pool.query(
      'UPDATE plans SET features = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(features), req.params.id]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Plan not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Admin update plan features error:', error);
    res.status(500).json({ error: 'Failed to update plan features' });
  }
});

module.exports = router;
