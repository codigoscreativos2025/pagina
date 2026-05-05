require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');
const redis = require('redis');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const agentRoutes = require('./routes/agents');
const planRoutes = require('./routes/plans');
const webhookRoutes = require('./routes/webhooks');
const adminRoutes = require('./routes/admin');
const crmRoutes = require('./routes/crm');
const funnelRoutes = require('./routes/funnels');
const integrationRoutes = require('./routes/integrations');
const automationRoutes = require('./routes/automations');
const analyticsRoutes = require('./routes/analytics');
const cronEngine = require('./services/cronEngine');

const app = express();
const PORT = process.env.PORT || 3001;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

global.pool = pool

let redisClient;

async function initRedis() {
  const redisOptions = {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  };
  if (process.env.REDIS_PASSWORD) {
    redisOptions.password = process.env.REDIS_PASSWORD;
  }
  
  redisClient = redis.createClient(redisOptions);
  redisClient.on('error', (err) => console.log('Redis error:', err));
  await redisClient.connect();
  global.redisClient = redisClient
  console.log('Redis connected');
}

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  req.pool = pool;
  req.redis = redisClient;
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/funnels', funnelRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    await initRedis();
    cronEngine.startEngine();
    
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        name VARCHAR(255),
        google_id VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        plan_id INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS agents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        business_info JSONB,
        system_prompt TEXT,
        ai_config JSONB,
        whatsapp_config JSONB,
        google_sheets_config JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        messages_limit INTEGER DEFAULT 100,
        features JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        agent_id INTEGER REFERENCES agents(id),
        client_phone VARCHAR(50) NOT NULL,
        name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'nuevo',
        is_ai_active BOOLEAN DEFAULT true,
        last_client_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id),
        sender_type VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS funnels (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS stages (
        id SERIAL PRIMARY KEY,
        funnel_id INTEGER REFERENCES funnels(id),
        name VARCHAR(255) NOT NULL,
        color VARCHAR(50) DEFAULT 'bg-gray-100 text-gray-800',
        ai_enabled BOOLEAN DEFAULT true,
        ai_timeout_hours INTEGER DEFAULT 0,
        order_index INTEGER DEFAULT 0
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        color VARCHAR(50) DEFAULT 'bg-gray-100 text-gray-800'
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS lead_tags (
        lead_id INTEGER REFERENCES leads(id),
        tag_id INTEGER REFERENCES tags(id),
        PRIMARY KEY (lead_id, tag_id)
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_integrations (
        user_id INTEGER PRIMARY KEY REFERENCES users(id),
        whatsapp_config JSONB,
        instagram_config JSONB,
        google_config JSONB,
        telegram_config JSONB,
        meta_ads_config JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS automation_flows (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        funnel_id INTEGER REFERENCES funnels(id),
        name VARCHAR(255) NOT NULL,
        nodes JSONB DEFAULT '[]'::jsonb,
        edges JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS pi_bots (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        trigger_type VARCHAR(50) DEFAULT 'schedule',
        schedule_cron VARCHAR(50),
        conditions JSONB DEFAULT '[]'::jsonb,
        actions JSONB DEFAULT '[]'::jsonb,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Migrations seguras
    try { await client.query('ALTER TABLE leads ADD COLUMN is_ai_active BOOLEAN DEFAULT true'); } catch (e) {}
    try { await client.query('ALTER TABLE leads ADD COLUMN last_client_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'); } catch (e) {}
    try { await client.query('ALTER TABLE leads ADD COLUMN stage_id INTEGER REFERENCES stages(id)'); } catch (e) {}
    try { await client.query('ALTER TABLE agents ADD COLUMN instagram_config JSONB'); } catch (e) {}
    try { await client.query("ALTER TABLE agents ADD COLUMN permissions JSONB DEFAULT '[]'::jsonb"); } catch (e) {}
    try { await client.query("ALTER TABLE leads ADD COLUMN custom_fields JSONB DEFAULT '{}'::jsonb"); } catch (e) {}
    try { await client.query('ALTER TABLE user_integrations ADD COLUMN meta_ads_config JSONB'); } catch (e) {}
    
    const plans = await client.query('SELECT COUNT(*) FROM plans');
    if (parseInt(plans.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO plans (name, price, messages_limit, features) VALUES
        ('Gratis', 0, 50, '{"basic": true}'),
        ('Starter', 19.99, 500, '{"google_sheets": true}'),
        ('Pro', 49.99, 2000, '{"google_sheets": true, "multiple_channels": true}'),
        ('Business', 99.99, 10000, '{"api_access": true}'),
        ('Enterprise', 299.99, 999999, '{"priority": true, "support": true}')
      `);
    }
    
    client.release();
    console.log('Database initialized');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

start();
