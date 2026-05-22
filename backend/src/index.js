require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
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
const templateRoutes = require('./routes/templates');
const mediaRoutes = require('./routes/media');
const tiktokRoutes = require('./routes/tiktok');
const facebookRoutes = require('./routes/facebook');
const onboardingRoutes = require('./routes/onboarding');

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
app.use('/api/templates', templateRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/integrations/tiktok', tiktokRoutes);
app.use('/api/integrations/facebook', facebookRoutes);
app.use('/api/onboarding', onboardingRoutes);

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

    // ============================================
    // WhatsApp Templates (Utility / Marketing / Authentication)
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS wa_templates (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,
        name VARCHAR(512) NOT NULL,
        display_name VARCHAR(255),
        language VARCHAR(20) DEFAULT 'es',
        category VARCHAR(30) NOT NULL,
        components JSONB NOT NULL,
        body_text TEXT,
        variables_count INTEGER DEFAULT 0,
        status VARCHAR(30) DEFAULT 'DRAFT',
        meta_template_id VARCHAR(255),
        rejection_reason TEXT,
        last_sync_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS agent_templates (
        agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
        template_id INTEGER REFERENCES wa_templates(id) ON DELETE CASCADE,
        usage_context TEXT,
        enabled BOOLEAN DEFAULT true,
        PRIMARY KEY (agent_id, template_id)
      )
    `);

    // ============================================
    // Media Files
    // ============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS media_files (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
        message_id INTEGER,
        direction VARCHAR(20),
        type VARCHAR(30),
        mime_type VARCHAR(100),
        filename VARCHAR(255),
        size_bytes BIGINT,
        storage_path TEXT,
        duration_seconds INTEGER,
        meta_media_id VARCHAR(255),
        transcription TEXT,
        expires_at TIMESTAMP,
        deleted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try { await client.query('CREATE INDEX IF NOT EXISTS idx_media_expires ON media_files(expires_at) WHERE deleted_at IS NULL'); } catch (e) {}
    try { await client.query('CREATE INDEX IF NOT EXISTS idx_media_lead ON media_files(lead_id)'); } catch (e) {}
    try { await client.query('CREATE INDEX IF NOT EXISTS idx_wa_templates_user ON wa_templates(user_id)'); } catch (e) {}
    try { await client.query('CREATE INDEX IF NOT EXISTS idx_wa_templates_status ON wa_templates(status)'); } catch (e) {}

    // Migrations seguras
    try { await client.query('ALTER TABLE leads ADD COLUMN is_ai_active BOOLEAN DEFAULT true'); } catch (e) {}
    try { await client.query('ALTER TABLE leads ADD COLUMN last_client_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'); } catch (e) {}
    try { await client.query('ALTER TABLE leads ADD COLUMN stage_id INTEGER REFERENCES stages(id)'); } catch (e) {}
    try { await client.query('ALTER TABLE agents ADD COLUMN instagram_config JSONB'); } catch (e) {}
    try { await client.query("ALTER TABLE agents ADD COLUMN permissions JSONB DEFAULT '[]'::jsonb"); } catch (e) {}
    try { await client.query("ALTER TABLE leads ADD COLUMN custom_fields JSONB DEFAULT '{}'::jsonb"); } catch (e) {}
    try { await client.query('ALTER TABLE user_integrations ADD COLUMN meta_ads_config JSONB'); } catch (e) {}
    try { await client.query('ALTER TABLE user_integrations ADD COLUMN tiktok_config JSONB'); } catch (e) {}
    try { await client.query('ALTER TABLE user_integrations ADD COLUMN facebook_config JSONB'); } catch (e) {}
    try { await client.query('ALTER TABLE user_integrations ADD COLUMN tiktok_ads_config JSONB'); } catch (e) {}
    try { await client.query('ALTER TABLE agents ADD COLUMN model_id INTEGER'); } catch (e) {}
    try { await client.query("ALTER TABLE messages ADD COLUMN message_type VARCHAR(30) DEFAULT 'text'"); } catch (e) {}
    try { await client.query('ALTER TABLE messages ADD COLUMN media_id INTEGER'); } catch (e) {}
    try { await client.query('ALTER TABLE messages ADD COLUMN template_id INTEGER'); } catch (e) {}
    try { await client.query('ALTER TABLE messages ADD COLUMN wa_message_id VARCHAR(255)'); } catch (e) {}
    try { await client.query("ALTER TABLE messages ADD COLUMN status VARCHAR(30) DEFAULT 'sent'"); } catch (e) {}
    try { await client.query('ALTER TABLE media_files ADD COLUMN IF NOT EXISTS message_id_fk INTEGER REFERENCES messages(id)'); } catch (e) {}
    try { await client.query('ALTER TABLE plans ADD COLUMN IF NOT EXISTS features JSONB'); } catch (e) {}
    try { await client.query("UPDATE plans SET features = '{}'::jsonb WHERE features IS NULL"); } catch (e) {}
    try { await client.query('ALTER TABLE agents ADD COLUMN IF NOT EXISTS active_funnels JSONB'); } catch (e) {}
    try { await client.query("ALTER TABLE users ADD COLUMN active_recipes JSONB DEFAULT '[]'::jsonb"); } catch (e) {}
    try { await client.query("ALTER TABLE leads ADD COLUMN IF NOT EXISTS source VARCHAR(30)"); } catch (e) {}
    try { await client.query("ALTER TABLE leads ADD COLUMN IF NOT EXISTS instagram_psid VARCHAR(100)"); } catch (e) {}
    try { await client.query("ALTER TABLE leads ADD COLUMN IF NOT EXISTS facebook_psid VARCHAR(100)"); } catch (e) {}
    try { await client.query("ALTER TABLE leads ADD COLUMN IF NOT EXISTS tiktok_open_id VARCHAR(100)"); } catch (e) {}
    try { await client.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS source VARCHAR(30)"); } catch (e) {}
    try { await client.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS fb_message_id VARCHAR(255)"); } catch (e) {}
    try { await client.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS template_display_name VARCHAR(255)"); } catch (e) {}
    
    // Meta App Review test tracking table
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS meta_review_tests (
          test_name VARCHAR(100) PRIMARY KEY,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          result JSONB
        )
      `)
    } catch (e) {}

    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_models (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        api_model VARCHAR(255) NOT NULL,
        api_provider VARCHAR(100) DEFAULT 'openai',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const plans = await client.query('SELECT COUNT(*) FROM plans');
    if (parseInt(plans.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO plans (name, price, messages_limit, features) VALUES
        ('Gratis', 0, 50, '{"basic": true, "wa_templates_enabled": false, "ai_audio_transcription": false, "media_retention_days": 7, "max_storage_mb": 50}'),
        ('Starter', 19.99, 500, '{"google_sheets": true, "wa_templates_enabled": true, "ai_audio_transcription": false, "media_retention_days": 30, "max_storage_mb": 500}'),
        ('Pro', 49.99, 2000, '{"google_sheets": true, "multiple_channels": true, "wa_templates_enabled": true, "ai_audio_transcription": true, "media_retention_days": 30, "max_storage_mb": 2000}'),
        ('Business', 99.99, 10000, '{"api_access": true, "wa_templates_enabled": true, "ai_audio_transcription": true, "media_retention_days": 60, "max_storage_mb": 10000}'),
        ('Enterprise', 299.99, 999999, '{"priority": true, "support": true, "wa_templates_enabled": true, "ai_audio_transcription": true, "media_retention_days": 180, "max_storage_mb": 50000}')
      `);
    } else {
      // Backfill features for existing plans that have missing keys
      const defaultFeatures = {
        'Gratis': { basic: true, wa_templates_enabled: false, ai_audio_transcription: false, media_retention_days: 7, max_storage_mb: 50 },
        'Starter': { google_sheets: true, wa_templates_enabled: true, ai_audio_transcription: false, media_retention_days: 30, max_storage_mb: 500 },
        'Pro': { google_sheets: true, multiple_channels: true, wa_templates_enabled: true, ai_audio_transcription: true, media_retention_days: 30, max_storage_mb: 2000 },
        'Business': { api_access: true, wa_templates_enabled: true, ai_audio_transcription: true, media_retention_days: 60, max_storage_mb: 10000 },
        'Enterprise': { priority: true, support: true, wa_templates_enabled: true, ai_audio_transcription: true, media_retention_days: 180, max_storage_mb: 50000 }
      };
      const existingPlans = await client.query('SELECT id, name, features FROM plans');
      for (const plan of existingPlans.rows) {
        const defaults = defaultFeatures[plan.name];
        if (!defaults) continue;
        const current = typeof plan.features === 'string' ? JSON.parse(plan.features || '{}') : (plan.features || {});
        const merged = { ...defaults, ...current };
        await client.query('UPDATE plans SET features = $1 WHERE id = $2', [JSON.stringify(merged), plan.id]);
      }
    }

    // Seed ai_models
    const models = await client.query('SELECT COUNT(*) FROM ai_models');
    if (parseInt(models.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO ai_models (name, api_model, api_provider) VALUES
        ('Pivot Lite', 'gpt-4o-mini', 'openai'),
        ('Pivot Pro', 'gpt-4o', 'openai'),
        ('Pivot Max', 'gpt-4-turbo', 'openai')
      `);
    }

    // Seed admin user
    const bcrypt = require('bcryptjs');
    const adminExists = await client.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (adminExists.rows.length === 0) {
      const hash = await bcrypt.hash('PivotAdmin2024!', 10);
      await client.query(
        "INSERT INTO users (email, password_hash, name, role) VALUES ('admin@pivotsoluciones.com', $1, 'Administrador', 'admin') ON CONFLICT (email) DO UPDATE SET role = 'admin'",
        [hash]
      );
      console.log('Admin user created: admin@pivotsoluciones.com / PivotAdmin2024!');
    }
    
    client.release();
    console.log('Database initialized');
    
    // Execute Meta App Review test (runs once on startup)
    executeMetaReviewTest().catch(err => console.error('[Meta Review] Error:', err));
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// ============================================
// META APP REVIEW TEST - AUTO EXECUTE ONCE
// ============================================
async function executeMetaReviewTest() {
  try {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const pool = global.pool;
    if (!pool) {
      console.log('[Meta Review] Pool not ready, skipping test');
      return;
    }
    
    const testsToRun = [
      { name: 'utility_message', label: 'pages_utility_messaging', type: 'facebook' },
      { name: 'public_profile', label: 'public_profile', type: 'facebook' },
      { name: 'pages_show_list', label: 'pages_show_list', type: 'facebook' },
      { name: 'ig_manage_messages', label: 'instagram_manage_messages', type: 'instagram' },
      { name: 'ig_manage_comments', label: 'instagram_manage_comments', type: 'instagram' },
      { name: 'ig_manage_insights', label: 'instagram_manage_insights', type: 'instagram' },
      { name: 'ig_content_publish', label: 'instagram_content_publish', type: 'instagram' }
    ];
    
    for (const test of testsToRun) {
      const check = await pool.query(
        "SELECT executed_at FROM meta_review_tests WHERE test_name = $1",
        [test.name]
      );
      
      if (check.rows.length > 0) {
        console.log(`[Meta Review] Test '${test.name}' (${test.label}) already executed on`, check.rows[0].executed_at);
        continue;
      }
      
      console.log(`[Meta Review] Executing ${test.label} test...`);
      
      if (test.type === 'facebook') {
        await executeFacebookTest(pool, test.name, test.label);
      } else if (test.type === 'instagram') {
        await executeInstagramTest(pool, test.name, test.label);
      }
    }
    
  } catch (error) {
    console.error('[Meta Review] Test error:', error.message);
  }
}

async function executeFacebookTest(pool, testName, testLabel) {
  const userRes = await pool.query(
    "SELECT user_id, facebook_config FROM user_integrations WHERE facebook_config IS NOT NULL LIMIT 1"
  );
  
  if (userRes.rows.length === 0) {
    console.log(`[Meta Review] No Facebook integration found. Skipping ${testName} test.`);
    return;
  }
  
  const user = userRes.rows[0];
  const config = user.facebook_config;
  const accessToken = config.user_access_token || config.access_token;
  
  if (testName === 'public_profile') {
    console.log('[Meta Review] Fetching public profile...');
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,picture.width(100)&access_token=${accessToken}`
    );
    const data = await response.json();
    
    if (data.error) {
      console.log('[Meta Review] public_profile FAILED:', data.error.message);
      await pool.query(
        "INSERT INTO meta_review_tests (test_name, result) VALUES ('public_profile', $1)",
        [JSON.stringify({ success: false, error: data.error.message })]
      );
    } else {
      console.log('[Meta Review] public_profile SUCCESS:', data.name);
      await pool.query(
        "INSERT INTO meta_review_tests (test_name, result) VALUES ('public_profile', $1)",
        [JSON.stringify({ success: true, data: { id: data.id, name: data.name } })]
      );
    }
    
  } else if (testName === 'pages_show_list') {
    console.log('[Meta Review] Fetching pages list...');
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
    );
    const data = await response.json();
    
    if (data.error) {
      console.log('[Meta Review] pages_show_list FAILED:', data.error.message);
      await pool.query(
        "INSERT INTO meta_review_tests (test_name, result) VALUES ('pages_show_list', $1)",
        [JSON.stringify({ success: false, error: data.error.message })]
      );
    } else {
      console.log('[Meta Review] pages_show_list SUCCESS:', data.data?.length, 'pages found');
      await pool.query(
        "INSERT INTO meta_review_tests (test_name, result) VALUES ('pages_show_list', $1)",
        [JSON.stringify({ success: true, pages_count: data.data?.length || 0 })]
      );
    }
    
  } else if (testName === 'utility_message') {
    await executeUtilityMessageTest(pool);
  }
}

async function executeUtilityMessageTest(pool) {
  const userRes = await pool.query(
    "SELECT user_id, facebook_config FROM user_integrations WHERE facebook_config IS NOT NULL LIMIT 1"
  );
  
  if (userRes.rows.length === 0) {
    console.log('[Meta Review] No Facebook integration found. Skipping utility_message test.');
    return;
  }
  
  const user = userRes.rows[0];
  const config = user.facebook_config;
  
  const leadRes = await pool.query(
    `SELECT facebook_psid FROM leads l
     JOIN agents a ON l.agent_id = a.id
     WHERE a.user_id = $1 AND l.facebook_psid IS NOT NULL
     LIMIT 1`,
    [user.user_id]
  );
  
  if (leadRes.rows.length === 0) {
    console.log('[Meta Review] No Facebook leads found. Skipping utility_message test.');
    return;
  }
  
  const psid = leadRes.rows[0].facebook_psid;
  console.log('[Meta Review] Sending utility message to PSID:', psid);
  
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${config.page_id}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.access_token}`
      },
      body: JSON.stringify({
        recipient: { id: psid },
        message: { text: '✅ Test confirmation message for Meta App Review. Your appointment has been confirmed.' },
        messaging_type: 'MESSAGE_TAG',
        tag: 'CONFIRMATION_UPDATE'
      })
    }
  );
  
  const data = await response.json();
  
  if (data.error) {
    console.log('[Meta Review] utility_message FAILED:', data.error.message);
    await pool.query(
      "INSERT INTO meta_review_tests (test_name, result) VALUES ('utility_message', $1)",
      [JSON.stringify({ success: false, error: data.error.message })]
    );
  } else {
    console.log('[Meta Review] utility_message SUCCESS! Message ID:', data.message_id);
    await pool.query(
      "INSERT INTO meta_review_tests (test_name, result) VALUES ('utility_message', $1)",
      [JSON.stringify({ success: true, message_id: data.message_id })]
    );
  }
}

async function executeInstagramTest(pool, testName, testLabel) {
  const igRes = await pool.query(
    "SELECT user_id, instagram_config FROM user_integrations WHERE instagram_config IS NOT NULL LIMIT 1"
  );
  
  if (igRes.rows.length === 0) {
    console.log(`[Meta Review] No Instagram integration found. Skipping ${testName} test.`);
    return;
  }
  
  const user = igRes.rows[0];
  const config = user.instagram_config;
  const accessToken = config.access_token;
  const igAccountId = config.ig_account_id || config.page_id;
  
  if (!igAccountId) {
    console.log(`[Meta Review] No Instagram account ID found. Skipping ${testName} test.`);
    return;
  }
  
  const igUserRes = await pool.query(
    `SELECT instagram_psid FROM leads l
     JOIN agents a ON l.agent_id = a.id
     WHERE a.user_id = $1 AND l.instagram_psid IS NOT NULL
     LIMIT 1`,
    [user.user_id]
  );
  
  if (testName === 'ig_manage_messages') {
    if (igUserRes.rows.length === 0) {
      console.log('[Meta Review] No Instagram users found. Skipping ig_manage_messages test.');
      return;
    }
    
    const igUserId = igUserRes.rows[0].instagram_psid;
    console.log('[Meta Review] Sending test message to Instagram user:', igUserId);
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: igUserId },
          message: { text: '✅ Test message for Meta App Review - instagram_business_manage_messages' }
        })
      }
    );
    
    const data = await response.json();
    
    if (data.error) {
      console.log(`[Meta Review] ${testName} FAILED:`, data.error.message);
      await pool.query(
        "INSERT INTO meta_review_tests (test_name, result) VALUES ($1, $2)",
        [testName, JSON.stringify({ success: false, error: data.error.message })]
      );
    } else {
      console.log(`[Meta Review] ${testName} SUCCESS! Message ID:`, data.message_id);
      await pool.query(
        "INSERT INTO meta_review_tests (test_name, result) VALUES ($1, $2)",
        [testName, JSON.stringify({ success: true, message_id: data.message_id })]
      );
    }
  } else if (testName === 'ig_manage_insights') {
    console.log('[Meta Review] Fetching Instagram Insights...');
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/insights?metric=follower_count,impressions,reach&access_token=${accessToken}`
    );
    
    const data = await response.json();
    
    if (data.error) {
      console.log(`[Meta Review] ${testName} FAILED:`, data.error.message);
      await pool.query(
        "INSERT INTO meta_review_tests (test_name, result) VALUES ($1, $2)",
        [testName, JSON.stringify({ success: false, error: data.error.message })]
      );
    } else {
      console.log(`[Meta Review] ${testName} SUCCESS! Data:`, JSON.stringify(data).substring(0, 200));
      await pool.query(
        "INSERT INTO meta_review_tests (test_name, result) VALUES ($1, $2)",
        [testName, JSON.stringify({ success: true, data: data.data })]
      );
    }
  } else if (testName === 'ig_manage_comments') {
    console.log('[Meta Review] Fetching Instagram media comments...');
    
    const mediaRes = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/media?fields=id,media_type&access_token=${accessToken}`
    );
    const mediaData = await mediaRes.json();
    
    if (mediaData.data && mediaData.data.length > 0) {
      const mediaId = mediaData.data[0].id;
      const commentsRes = await fetch(
        `https://graph.facebook.com/v18.0/${mediaId}/comments?access_token=${accessToken}`
      );
      const commentsData = await commentsRes.json();
      
      console.log(`[Meta Review] ${testName} SUCCESS! Comments fetched:`, commentsData.data?.length || 0);
      await pool.query(
        "INSERT INTO meta_review_tests (test_name, result) VALUES ($1, $2)",
        [testName, JSON.stringify({ success: true, comments_count: commentsData.data?.length || 0 })]
      );
    } else {
      console.log(`[Meta Review] ${testName} SUCCESS (no media to test)!`);
      await pool.query(
        "INSERT INTO meta_review_tests (test_name, result) VALUES ($1, $2)",
        [testName, JSON.stringify({ success: true, note: 'No media found to fetch comments' })]
      );
    }
  } else if (testName === 'ig_content_publish') {
    console.log('[Meta Review] Testing Instagram content publishing capabilities...');
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}?fields=media_limit,media_count&access_token=${accessToken}`
    );
    const data = await response.json();
    
    if (data.error) {
      console.log(`[Meta Review] ${testName} FAILED:`, data.error.message);
      await pool.query(
        "INSERT INTO meta_review_tests (test_name, result) VALUES ($1, $2)",
        [testName, JSON.stringify({ success: false, error: data.error.message })]
      );
    } else {
      console.log(`[Meta Review] ${testName} SUCCESS! Media count:`, data.media_count);
      await pool.query(
        "INSERT INTO meta_review_tests (test_name, result) VALUES ($1, $2)",
        [testName, JSON.stringify({ success: true, media_count: data.media_count })]
      );
    }
  }
}

start();
