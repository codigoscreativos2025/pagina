const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/me', auth, async (req, res) => {
  try {
    const result = await req.pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.plan_id, u.is_active, u.created_at,
              p.name as plan_name, p.price, p.messages_limit, p.features
       FROM users u
       LEFT JOIN plans p ON u.plan_id = p.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

router.put('/me', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    await req.pool.query(
      'UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [name, req.user.id]
    );
    
    const result = await req.pool.query(
      'SELECT id, email, name, role, plan_id, is_active FROM users WHERE id = $1',
      [req.user.id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.get('/my-agent', auth, async (req, res) => {
  try {
    const result = await req.pool.query(
      `SELECT * FROM agents WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.json(null);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({ error: 'Failed to get agent' });
  }
});

module.exports = router;
