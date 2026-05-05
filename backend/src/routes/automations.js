const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')

// 1. Endpoints para el Lienzo Visual (React Flow)
router.get('/flows/:funnelId', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const funnelId = req.params.funnelId
    
    let flow = await pool.query('SELECT * FROM automation_flows WHERE funnel_id = $1 AND user_id = $2', [funnelId, userId])
    if (flow.rows.length === 0) {
      return res.json({ success: true, flow: null })
    }
    
    res.json({ success: true, flow: flow.rows[0] })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/flows/:funnelId', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const funnelId = req.params.funnelId
    const { name, nodes, edges } = req.body

    const check = await pool.query('SELECT id FROM automation_flows WHERE funnel_id = $1 AND user_id = $2', [funnelId, userId])
    
    if (check.rows.length === 0) {
      const result = await pool.query(
        'INSERT INTO automation_flows (user_id, funnel_id, name, nodes, edges) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, funnelId, name || 'Nuevo Flujo', JSON.stringify(nodes), JSON.stringify(edges)]
      )
      return res.json({ success: true, flow: result.rows[0] })
    } else {
      await pool.query(
        'UPDATE automation_flows SET name = $1, nodes = $2, edges = $3, updated_at = CURRENT_TIMESTAMP WHERE funnel_id = $4',
        [name || 'Flujo Editado', JSON.stringify(nodes), JSON.stringify(edges), funnelId]
      )
      return res.json({ success: true })
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 2. Endpoints para PIBots
router.get('/pibots', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const bots = await pool.query('SELECT * FROM pi_bots WHERE user_id = $1', [userId])
    res.json({ success: true, bots: bots.rows })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/pibots', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const { name, trigger_type, schedule_cron, conditions, actions, is_active } = req.body
    
    const result = await pool.query(`
      INSERT INTO pi_bots (user_id, name, trigger_type, schedule_cron, conditions, actions, is_active) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [userId, name, trigger_type, schedule_cron, JSON.stringify(conditions), JSON.stringify(actions), is_active])
    
    res.json({ success: true, bot: result.rows[0] })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/pibots/:id', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const botId = req.params.id
    const { name, trigger_type, schedule_cron, conditions, actions, is_active } = req.body

    await pool.query(`
      UPDATE pi_bots SET 
        name = $1, trigger_type = $2, schedule_cron = $3, 
        conditions = $4, actions = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND user_id = $8
    `, [name, trigger_type, schedule_cron, JSON.stringify(conditions), JSON.stringify(actions), is_active, botId, userId])
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/pibots/:id', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const botId = req.params.id
    
    await pool.query('DELETE FROM pi_bots WHERE id = $1 AND user_id = $2', [botId, userId])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
