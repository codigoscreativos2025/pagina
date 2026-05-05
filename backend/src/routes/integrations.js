const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')

// Get user integrations
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.pool
    const result = await pool.query('SELECT * FROM user_integrations WHERE user_id = $1', [req.user.id])
    
    if (result.rows.length === 0) {
      return res.json({ success: true, integrations: {} })
    }
    
    res.json({ success: true, integrations: result.rows[0] })
  } catch (error) {
    console.error('Error fetching integrations:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update integration
router.put('/:type', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    const type = req.params.type // 'whatsapp', 'instagram', 'google', 'telegram'
    const config = req.body
    
    const allowedTypes = ['whatsapp', 'instagram', 'google', 'telegram']
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid integration type' })
    }

    const column = `${type}_config`

    // Check if exists
    const check = await pool.query('SELECT user_id FROM user_integrations WHERE user_id = $1', [userId])
    
    if (check.rows.length === 0) {
      await pool.query(
        `INSERT INTO user_integrations (user_id, ${column}) VALUES ($1, $2)`,
        [userId, JSON.stringify(config)]
      )
    } else {
      await pool.query(
        `UPDATE user_integrations SET ${column} = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
        [JSON.stringify(config), userId]
      )
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error updating integration:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
