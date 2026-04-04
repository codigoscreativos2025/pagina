const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await req.pool.query(
      'SELECT * FROM plans ORDER BY price ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to get plans' });
  }
});

router.post('/select', auth, async (req, res) => {
  try {
    const { plan_id } = req.body;
    
    const planExists = await req.pool.query(
      'SELECT id FROM plans WHERE id = $1',
      [plan_id]
    );
    
    if (planExists.rows.length === 0) {
      return res.status(400).json({ error: 'Plan not found' });
    }
    
    await req.pool.query(
      'UPDATE users SET plan_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [plan_id, req.user.id]
    );
    
    res.json({ success: true, plan_id });
  } catch (error) {
    console.error('Change plan error:', error);
    res.status(500).json({ error: 'Failed to change plan' });
  }
});

module.exports = router;
