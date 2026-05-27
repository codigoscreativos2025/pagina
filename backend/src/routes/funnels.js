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
// Update funnel
router.put('/:id', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const { name } = req.body
    await pool.query('UPDATE funnels SET name = $1 WHERE id = $2 AND user_id = $3', [name, req.params.id, userId])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create new funnel
router.post('/', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const { name } = req.body
    const newFunnel = await pool.query('INSERT INTO funnels (user_id, name) VALUES ($1, $2) RETURNING *', [userId, name])
    res.json({ success: true, funnel: newFunnel.rows[0] })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete funnel
router.delete('/:id', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const funnelId = req.params.id
    // Verify ownership
    const check = await pool.query('SELECT id FROM funnels WHERE id = $1 AND user_id = $2', [funnelId, userId])
    if (check.rows.length === 0) return res.status(403).json({ error: 'Unauthorized' })
    
    // Cascading delete might be needed depending on FK constraints, let's delete stages first
    await pool.query('DELETE FROM stages WHERE funnel_id = $1', [funnelId])
    await pool.query('DELETE FROM funnels WHERE id = $1', [funnelId])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all stages for user's default funnel
router.get('/stages', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const funnel = await ensureDefaultFunnel(pool, userId)
    const stages = await pool.query(
      'SELECT * FROM stages WHERE funnel_id = $1 ORDER BY order_index',
      [funnel.id]
    )
    res.json({ success: true, stages: stages.rows })
  } catch (error) {
    console.error('Error fetching stages:', error)
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
// Create a stage
router.post('/stages', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const { funnel_id, name, color, ai_enabled, order_index } = req.body

    const check = await pool.query('SELECT id FROM funnels WHERE id = $1 AND user_id = $2', [funnel_id, userId])
    if (check.rows.length === 0) return res.status(403).json({ error: 'Unauthorized funnel' })

    const result = await pool.query(`
      INSERT INTO stages (funnel_id, name, color, ai_enabled, order_index) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [funnel_id, name, color || 'bg-gray-100 text-gray-800', ai_enabled || false, order_index || 0])

    res.json({ success: true, stage: result.rows[0] })
  } catch (error) {
    console.error('Error creating stage:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete a stage
router.delete('/stages/:id', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const stageId = req.params.id

    const check = await pool.query(`
      SELECT s.id FROM stages s
      JOIN funnels f ON s.funnel_id = f.id
      WHERE s.id = $1 AND f.user_id = $2
    `, [stageId, userId])

    if (check.rows.length === 0) return res.status(403).json({ error: 'Unauthorized stage' })

    await pool.query('DELETE FROM stages WHERE id = $1', [stageId])
    res.json({ success: true })
  } catch (error) {
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
