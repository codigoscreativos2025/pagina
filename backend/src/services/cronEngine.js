const cron = require('node-cron');
const waTemplates = require('../services/whatsappTemplates');

let cronTask = null;
let templateSyncTask = null;
let mediaCleanupTask = null;

const startEngine = () => {
  console.log('🤖 Iniciando Motor de Automatizaciones PIBots...');

  cronTask = cron.schedule('* * * * *', async () => {
    try {
      if (!global.pool) return;
      const client = await global.pool.connect();

      const botsRes = await client.query(`
        SELECT pb.*, a.whatsapp_config, a.name as agent_name
        FROM pi_bots pb
        JOIN agents a ON pb.user_id = a.user_id
        WHERE pb.is_active = true
        AND pb.trigger_type = 'schedule'
      `);

      const bots = botsRes.rows;
      for (const bot of bots) {
        try {
          if (!bot.schedule_cron) continue;

          const now = new Date();
          const cronParts = bot.schedule_cron.split(' ');
          if (cronParts.length === 5) {
            const cronDate = {
              minute: parseInt(cronParts[0]),
              hour: parseInt(cronParts[1]),
              dayOfMonth: parseInt(cronParts[2]),
              month: parseInt(cronParts[3]),
              dayOfWeek: parseInt(cronParts[4])
            };
            if (!(now.getMinutes() === cronDate.minute &&
                (cronDate.hour === '*' || now.getHours() === cronDate.hour) &&
                (cronDate.dayOfMonth === '*' || now.getDate() === cronDate.dayOfMonth) &&
                (cronDate.month === '*' || now.getMonth() + 1 === cronDate.month) &&
                (cronDate.dayOfWeek === '*' || now.getDay() === cronDate.dayOfWeek))) {
              continue;
            }
          }

          const actions = typeof bot.actions === 'string' ? JSON.parse(bot.actions) : (bot.actions || []);
          const conditions = typeof bot.conditions === 'string' ? JSON.parse(bot.conditions) : (bot.conditions || []);

          for (const action of actions) {
            if (action.type === 'send_template') {
              await executeSendTemplate(client, bot, action);
            } else if (action.type === 'send_message') {
              await executeSendMessage(client, bot, action);
            }
          }
        } catch (botErr) {
          console.error(`[PIBot] Error executing bot ${bot.id}:`, botErr);
        }
      }

      client.release();
    } catch (err) {
      console.error('Error en Cron Engine:', err);
    }
  });

  const syncInterval = parseInt(process.env.WA_TEMPLATE_SYNC_INTERVAL_MIN) || 60;
  const syncCron = `0 */${syncInterval} * * *`;
  templateSyncTask = cron.schedule(syncCron, async () => {
    try {
      if (!global.pool) return;
      const client = await global.pool.connect();
      const users = await client.query("SELECT DISTINCT user_id FROM wa_templates WHERE status IN ('PENDING', 'SUBMITTED')");
      for (const user of users.rows) {
        try {
          await waTemplates.syncAllTemplates(global.pool, user.user_id);
        } catch (e) {
          console.error(`[TemplateSync] Error for user ${user.user_id}:`, e);
        }
      }
      client.release();
    } catch (err) {
      console.error('[TemplateSync] Error:', err);
    }
  });

  mediaCleanupTask = cron.schedule('0 3 1 * *', async () => {
    try {
      if (!global.pool) return;
      console.log('[MediaCleanup] Starting monthly media cleanup...');
      const client = await global.pool.connect();

      const expired = await client.query(
        `SELECT id, storage_path FROM media_files
         WHERE expires_at < CURRENT_TIMESTAMP AND deleted_at IS NULL`
      );

      for (const file of expired.rows) {
        try {
          if (file.storage_path && require('fs').existsSync(file.storage_path)) {
            require('fs').unlinkSync(file.storage_path);
          }
          await client.query('UPDATE media_files SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [file.id]);
        } catch (e) {
          console.error(`[MediaCleanup] Error deleting file ${file.id}:`, e);
        }
      }

      client.release();
      console.log(`[MediaCleanup] Cleaned up ${expired.rows.length} expired files`);
    } catch (err) {
      console.error('[MediaCleanup] Error:', err);
    }
  });
};

async function executeSendTemplate(client, bot, action) {
  const { template_id, lead_filter, template_components } = action;
  if (!template_id) {
    console.error(`[PIBot] send_template action missing template_id for bot ${bot.id}`);
    return;
  }

  const templateResult = await global.pool.query(
    'SELECT * FROM wa_templates WHERE id = $1 AND user_id = $2 AND status = $3',
    [template_id, bot.user_id, 'APPROVED']
  );
  if (!templateResult.rows.length) {
    console.error(`[PIBot] Template ${template_id} not found or not approved`);
    return;
  }

  const template = templateResult.rows[0];

  let leadsQuery = `SELECT l.*, a.whatsapp_config FROM leads l JOIN agents a ON l.agent_id = a.id WHERE a.user_id = $1 AND l.is_ai_active = true`;
  const queryParams = [bot.user_id];

  if (lead_filter) {
    if (lead_filter.stage_id) {
      leadsQuery += ` AND l.stage_id = $${queryParams.length + 1}`;
      queryParams.push(lead_filter.stage_id);
    }
    if (lead_filter.tags) {
      leadsQuery += ` AND l.id IN (SELECT lt.lead_id FROM lead_tags lt JOIN tags t ON lt.tag_id = t.id WHERE t.name = ANY($${queryParams.length + 1}))`;
      queryParams.push(lead_filter.tags);
    }
  }

  leadsQuery += ' LIMIT 50';
  const leads = await global.pool.query(leadsQuery, queryParams);

  const whatsappConfig = typeof bot.whatsapp_config === 'string' ? JSON.parse(bot.whatsapp_config) : bot.whatsapp_config;
  if (!whatsappConfig?.access_token || !whatsappConfig?.phone_number_id) {
    console.error(`[PIBot] No WhatsApp config for bot ${bot.id}`);
    return;
  }

  for (const lead of leads.rows) {
    try {
      const result = await waTemplates.sendTemplateMessage(
        global.pool, bot.user_id, null,
        template.name, template.language,
        template_components || [],
        lead.client_phone
      );

      if (result.success) {
        await global.pool.query(
          `INSERT INTO messages (lead_id, sender_type, content, message_type, template_id, wa_message_id, status)
           VALUES ($1, 'bot', $2, 'template', $3, $4, 'sent')`,
          [lead.id, template.body_text || template.name, template_id, result.wa_message_id]
        );
      }
    } catch (e) {
      console.error(`[PIBot] Error sending template to lead ${lead.id}:`, e);
    }
  }
}

async function executeSendMessage(client, bot, action) {
  const { message, lead_filter } = action;
  if (!message) return;

  const { sendWhatsAppMessage } = require('./webhooks');

  let leadsQuery = `SELECT l.*, a.whatsapp_config FROM leads l JOIN agents a ON l.agent_id = a.id WHERE a.user_id = $1`;
  const queryParams = [bot.user_id];

  if (lead_filter) {
    if (lead_filter.stage_id) {
      leadsQuery += ` AND l.stage_id = $${queryParams.length + 1}`;
      queryParams.push(lead_filter.stage_id);
    }
  }

  leadsQuery += ' LIMIT 50';
  const leads = await global.pool.query(leadsQuery, queryParams);

  const whatsappConfig = typeof bot.whatsapp_config === 'string' ? JSON.parse(bot.whatsapp_config) : bot.whatsapp_config;
  const agentPhone = whatsappConfig?.phone?.replace(/\D/g, '') || '';

  for (const lead of leads.rows) {
    try {
      await sendWhatsAppMessage(lead.client_phone, agentPhone, message);
      await global.pool.query(
        `INSERT INTO messages (lead_id, sender_type, content, message_type, status)
         VALUES ($1, 'bot', $2, 'text', 'sent')`,
        [lead.id, message]
      );
    } catch (e) {
      console.error(`[PIBot] Error sending message to lead ${lead.id}:`, e);
    }
  }
}

const stopEngine = () => {
  if (cronTask) cronTask.stop();
  if (templateSyncTask) templateSyncTask.stop();
  if (mediaCleanupTask) mediaCleanupTask.stop();
  console.log('🛑 Motor de Automatizaciones Detenido.');
};

module.exports = {
  startEngine,
  stopEngine
};