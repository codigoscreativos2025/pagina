const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')

// Helper to ensure a default funnel exists for a user
async function ensureDefaultFunnel(pool, userId) {
  let funnel = await pool.query('SELECT * FROM funnels WHERE user_id = $1 LIMIT 1', [userId])
  
  if (funnel.rows.length === 0) {
    const newFunnel = await pool.query('INSERT INTO funnels (user_id, name) VALUES ($1, $2) RETURNING *', [userId, 'Embudo Principal'])
    const funnelId = newFunnel.rows[0].id
    
    // Create default stages
    await pool.query(`
      INSERT INTO stages (funnel_id, name, color, ai_enabled, order_index) VALUES 
      ($1, 'Nuevo', 'bg-blue-100 text-blue-800', true, 0),
      ($1, 'Contactado', 'bg-yellow-100 text-yellow-800', true, 1),
      ($1, 'Calificado', 'bg-purple-100 text-purple-800', false, 2),
      ($1, 'Cerrado', 'bg-green-100 text-green-800', false, 3)
    `, [funnelId])
    
    funnel = await pool.query('SELECT * FROM funnels WHERE id = $1', [funnelId])
  }
  
  return funnel.rows[0]
}

// Get user's funnels and stages
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id

    const funnel = await ensureDefaultFunnel(pool, userId)
    
    const stages = await pool.query('SELECT * FROM stages WHERE funnel_id = $1 ORDER BY order_index ASC', [funnel.id])
    
    res.json({ success: true, funnel, stages: stages.rows })
  } catch (error) {
    console.error('Error fetching funnels:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update a stage
router.put('/stages/:id', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const stageId = req.params.id
    const { name, color, ai_enabled, ai_timeout_hours } = req.body

    const check = await pool.query(`
      SELECT s.id FROM stages s
      JOIN funnels f ON s.funnel_id = f.id
      WHERE s.id = $1 AND f.user_id = $2
    `, [stageId, userId])

    if (check.rows.length === 0) return res.status(404).json({ error: 'Stage not found' })

    await pool.query(`
      UPDATE stages 
      SET name = $1, color = $2, ai_enabled = $3, ai_timeout_hours = $4 
      WHERE id = $5
    `, [name, color, ai_enabled, ai_timeout_hours, stageId])

    res.json({ success: true })
  } catch (error) {
    console.error('Error updating stage:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Tags CRUD
router.get('/tags', auth, async (req, res) => {
  try {
    const pool = req.pool
    const result = await pool.query('SELECT * FROM tags WHERE user_id = $1', [req.user.id])
    res.json({ success: true, tags: result.rows })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/tags', auth, async (req, res) => {
  try {
    const pool = req.pool
    const { name, color } = req.body
    const result = await pool.query(
      'INSERT INTO tags (user_id, name, color) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, name, color]
    )
    res.json({ success: true, tag: result.rows[0] })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
