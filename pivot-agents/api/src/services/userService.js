module.exports = {
  async findUserByPhone(phone) {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const result = await pool.query(
      `SELECT u.* FROM users u
       LEFT JOIN agents a ON u.id = a.user_id
       WHERE a.whatsapp_config->>'phone' = $1 OR a.whatsapp_config->>'wa_id' = $1`,
      [phone]
    );
    
    await pool.end();
    return result.rows[0] || null;
  }
};
