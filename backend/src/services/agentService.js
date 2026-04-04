module.exports = {
  async getAgentByUserId(userId) {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const result = await pool.query(
      'SELECT * FROM agents WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    
    await pool.end();
    return result.rows[0] || null;
  }
};
