const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

router.use((req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
});

router.get('/users', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const result = await req.pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.plan_id, u.is_active, u.created_at,
              p.name as plan_name, p.price
       FROM users u
       LEFT JOIN plans p ON u.plan_id = p.id
       ORDER BY u.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    const countResult = await req.pool.query('SELECT COUNT(*) FROM users');
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      users: result.rows,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const totalUsers = await req.pool.query('SELECT COUNT(*) FROM users');
    const activeUsers = await req.pool.query('SELECT COUNT(*) FROM users WHERE is_active = true');
    const totalAgents = await req.pool.query('SELECT COUNT(*) FROM agents');
    
    res.json({
      total: parseInt(totalUsers.rows[0].count),
      active: parseInt(activeUsers.rows[0].count),
      messages: parseInt(totalAgents.rows[0].count) * 100
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const result = await req.pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.plan_id, u.is_active, u.created_at,
              p.name as plan_name, p.price, p.messages_limit
       FROM users u
       LEFT JOIN plans p ON u.plan_id = p.id
       WHERE u.id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const agent = await req.pool.query(
      'SELECT * FROM agents WHERE user_id = $1',
      [req.params.id]
    );
    
    res.json({
      ...result.rows[0],
      agent: agent.rows[0] || null
    });
  } catch (error) {
    console.error('Admin get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

router.put('/users/:id/pause', async (req, res) => {
  try {
    await req.pool.query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [req.params.id]
    );
    
    await req.pool.query(
      'UPDATE agents SET is_active = false WHERE user_id = $1',
      [req.params.id]
    );
    
    res.json({ success: true, message: 'User paused' });
  } catch (error) {
    console.error('Admin pause user error:', error);
    res.status(500).json({ error: 'Failed to pause user' });
  }
});

router.put('/users/:id/activate', async (req, res) => {
  try {
    await req.pool.query(
      'UPDATE users SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [req.params.id]
    );
    
    await req.pool.query(
      'UPDATE agents SET is_active = true WHERE user_id = $1',
      [req.params.id]
    );
    
    res.json({ success: true, message: 'User activated' });
  } catch (error) {
    console.error('Admin activate user error:', error);
    res.status(500).json({ error: 'Failed to activate user' });
  }
});

router.put('/users/:id/plan', async (req, res) => {
  try {
    const { plan_id } = req.body;
    
    await req.pool.query(
      'UPDATE users SET plan_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [plan_id, req.params.id]
    );
    
    res.json({ success: true, message: 'Plan updated' });
  } catch (error) {
    console.error('Admin update plan error:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await req.pool.query('SELECT COUNT(*) FROM users');
    const activeUsers = await req.pool.query('SELECT COUNT(*) FROM users WHERE is_active = true');
    const totalAgents = await req.pool.query('SELECT COUNT(*) FROM agents');
    const activeAgents = await req.pool.query('SELECT COUNT(*) FROM agents WHERE is_active = true');
    
    const revenue = await req.pool.query(`
      SELECT SUM(p.price) as total 
      FROM users u 
      LEFT JOIN plans p ON u.plan_id = p.id 
      WHERE u.is_active = true
    `);
    
    res.json({
      total_users: parseInt(totalUsers.rows[0].count),
      active_users: parseInt(activeUsers.rows[0].count),
      total_agents: parseInt(totalAgents.rows[0].count),
      active_agents: parseInt(activeAgents.rows[0].count),
      monthly_revenue: parseFloat(revenue.rows[0].total) || 0
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;
