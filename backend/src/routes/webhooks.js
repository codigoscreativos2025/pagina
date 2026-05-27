const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const MessageQueue = require('../services/messageQueue')
const OpenClawService = require('../services/openclawService')
const mediaService = require('../services/mediaService')
const transcriptionService = require('../services/transcriptionService')
const { getPlanFeatures } = require('../middleware/planFeatures')

let messageQueue = null
let openclawService = null

router.get('/', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']
  
  if (mode === 'subscribe' && token === (process.env.WEBHOOK_VERIFY_TOKEN || 'pivot_verify_token')) {
    console.log('[WhatsApp] Webhook verified')
    return res.status(200).send(challenge)
  }
  
  console.log('[WhatsApp] Webhook verification failed')
  res.sendStatus(403)
})

router.post('/onboarding', auth, async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token) return res.status(400).json({ error: 'Missing access_token' });
    
    const APP_ID = process.env.FACEBOOK_APP_ID;
    const APP_SECRET = process.env.FACEBOOK_APP_SECRET;
    
    if (!APP_ID || !APP_SECRET) {
      console.warn('Faltan configurar FACEBOOK_APP_ID o FACEBOOK_APP_SECRET en el backend');
      return res.status(500).json({ error: 'Falta configuración en la aplicación.' });
    }

    // 1. Debug Token: Extraemos el WABA ID compartido
    const debugUrl = `https://graph.facebook.com/v18.0/debug_token?input_token=${access_token}&access_token=${APP_ID}|${APP_SECRET}`;
    const debugRes = await fetch(debugUrl);
    const debugData = await debugRes.json();
    
    let wabaId = null;
    const granularScopes = debugData?.data?.granular_scopes || [];
    for (const scopeObj of granularScopes) {
      if (scopeObj.scope === 'whatsapp_business_management' && scopeObj.target_ids && scopeObj.target_ids.length > 0) {
        wabaId = scopeObj.target_ids[0];
        break;
      }
    }
    
    if (!wabaId) {
      // Intentar método alternativo consultando la cuenta
      const wabaUrl = `https://graph.facebook.com/v18.0/me/client_whatsapp_business_accounts?access_token=${access_token}`;
      const wabaRes = await fetch(wabaUrl);
      const wabaJson = await wabaRes.json();
      if (wabaJson.data && wabaJson.data.length > 0) {
        wabaId = wabaJson.data[0].id;
      }
    }

    if (!wabaId) {
      return res.status(400).json({ error: 'No se encontraron Cuentas de WhatsApp Business compartidas.' });
    }

    // 2. Extraer Phone Number ID y display phone number
    const phoneRes = await fetch(`https://graph.facebook.com/v18.0/${wabaId}/phone_numbers?access_token=${access_token}`);
    const phoneData = await phoneRes.json();
    if (!phoneData.data || phoneData.data.length === 0) {
      return res.status(400).json({ error: 'No se encontró un número de teléfono en la cuenta WABA.' });
    }
    const phoneNumberId = phoneData.data[0].id;
    const displayPhone = phoneData.data[0].display_phone_number || phoneData.data[0].verified_name || '';

    // 3. Suscribir el Webhook a esta App y a este WABA
    await fetch(`https://graph.facebook.com/v18.0/${wabaId}/subscribed_apps`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    // 4. Guardar en Base de Datos para el Usuario
    const pool = req.pool;
    const agentExist = await pool.query('SELECT id, whatsapp_config FROM agents WHERE user_id = $1', [req.user.id]);
    
    // CRITICAL: Save ALL keys needed by the rest of the system
    let wtsConfig = {
      phone_number_id: phoneNumberId,
      access_token: access_token,
      waba_id: wabaId,
      phone: displayPhone
    };
    
    if (agentExist.rows.length > 0) {
      const oldConfig = agentExist.rows[0].whatsapp_config || {};
      wtsConfig = { ...oldConfig, ...wtsConfig };
      await pool.query('UPDATE agents SET whatsapp_config = $1, is_active = true WHERE user_id = $2', [JSON.stringify(wtsConfig), req.user.id]);
    } else {
      await pool.query(`INSERT INTO agents (user_id, name, whatsapp_config) VALUES ($1, 'Nuevo Agente', $2)`, [req.user.id, JSON.stringify(wtsConfig)]);
    }

    // CRITICAL: Also save to user_integrations so the frontend sees it as connected
    const intCheck = await pool.query('SELECT user_id FROM user_integrations WHERE user_id = $1', [req.user.id]);
    if (intCheck.rows.length === 0) {
      await pool.query('INSERT INTO user_integrations (user_id, whatsapp_config) VALUES ($1, $2)', [req.user.id, JSON.stringify(wtsConfig)]);
    } else {
      // Merge with existing whatsapp_config in user_integrations
      const oldIntConfig = intCheck.rows[0].whatsapp_config || {};
      const mergedIntConfig = { ...oldIntConfig, ...wtsConfig };
      await pool.query('UPDATE user_integrations SET whatsapp_config = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', [JSON.stringify(mergedIntConfig), req.user.id]);
    }

    console.log('[Meta Onboarding] Completado exitosamente para user:', req.user.id);

    // Convert short-lived token to long-lived (60 days) in background
    if (APP_ID && APP_SECRET) {
      try {
        const exchangeRes = await fetch(
          `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${access_token}`
        )
        const exchangeData = await exchangeRes.json()
        if (!exchangeData.error && exchangeData.access_token) {
          wtsConfig.access_token = exchangeData.access_token
          wtsConfig.token_refreshed_at = new Date().toISOString()
          wtsConfig.token_expires_in = exchangeData.expires_in
          await pool.query(
            'UPDATE user_integrations SET whatsapp_config = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
            [JSON.stringify(wtsConfig), req.user.id]
          )
          console.log('[Meta Onboarding] ✅ Token convertido a larga duración (' + Math.round(exchangeData.expires_in / 86400) + ' días)')
        }
      } catch (e) {
        console.log('[Meta Onboarding] ⚠️ No se pudo convertir token a larga duración:', e.message)
      }
    }

    res.json({ success: true, phone_number_id: phoneNumberId, waba_id: wabaId });

  } catch (error) {
    console.error('Meta onboarding error:', error);
    res.status(500).json({ error: 'Fallo interno al registrar WhatsApp. API caída.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const entry = req.body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const message = value?.messages?.[0]
    
    if (!message) {
      return res.sendStatus(200)
    }

    const from = message.from
    const type = message.type
    const agentPhone = value?.metadata?.display_phone_number
    const clientName = value?.contacts?.[0]?.profile?.name || from
    
    console.log('[WhatsApp] Received message:', { from, agentPhone, type })

    if (type === 'text') {
      const text = message.text?.body
      await handleIncomingMessage(req, from, text, agentPhone, clientName)
    } else if (['audio', 'image', 'document', 'video', 'sticker'].includes(type)) {
      await handleIncomingMedia(req, from, message, type, agentPhone, clientName)
    }
    
    res.sendStatus(200)
  } catch (error) {
    console.error('[WhatsApp] Webhook error:', error)
    res.sendStatus(200)
  }
})

async function handleIncomingMedia(req, clientPhone, message, mediaType, agentPhone, clientName) {
  const pool = req.pool || global.pool

  try {
    const agentIdResult = await pool.query(
      `SELECT id, user_id, whatsapp_config FROM agents WHERE REGEXP_REPLACE(whatsapp_config->>'phone', '\\D', '', 'g') = $1 AND is_active = true LIMIT 1`,
      [agentPhone]
    )
    if (!agentIdResult.rows.length) {
      console.log(`[WhatsApp Media] No agent found for business phone: ${agentPhone}`)
      return
    }

    const agent = agentIdResult.rows[0]
    const agentId = agent.id
    const userId = agent.user_id
    const whatsappConfig = typeof agent.whatsapp_config === 'string' ? JSON.parse(agent.whatsapp_config) : agent.whatsapp_config
    const accessToken = whatsappConfig?.access_token

    if (!accessToken) {
      console.error('[WhatsApp Media] No access token for agent:', agentId)
      return
    }

    const mediaObj = message[mediaType]
    const metaMediaId = mediaObj?.id
    const mimeType = mediaObj?.mime_type || mediaObj?.mimetype || ''
    const filename = mediaObj?.filename || mediaObj?.caption || `${mediaType}_${metaMediaId}`
    const caption = mediaObj?.caption || ''
    const duration = mediaObj?.duration_seconds || null

    if (!metaMediaId) {
      console.error('[WhatsApp Media] No media ID in message')
      return
    }

    const leadId = await getOrCreateLeadAndUpdateTimestamp(pool, agentId, clientPhone, clientName)

    const downloadResult = await mediaService.downloadFromMeta(metaMediaId, accessToken)
    if (!downloadResult.success) {
      console.error('[WhatsApp Media] Download failed:', downloadResult.error)
      await saveMessage(pool, leadId, 'client', caption || `[${mediaType.toUpperCase()}] ${filename}`)
      return
    }

    const classifiedType = mediaService.classifyMedia(mediaType, downloadResult.mime_type || mimeType)
    const saved = await mediaService.saveBuffer(userId, downloadResult.buffer, downloadResult.filename, downloadResult.mime_type || mimeType)
    const expiresAt = await mediaService.calculateExpiration(userId, pool)

    const mediaResult = await pool.query(
      `INSERT INTO media_files (user_id, lead_id, direction, type, mime_type, filename, size_bytes, storage_path, duration_seconds, meta_media_id, transcription, expires_at)
       VALUES ($1, $2, 'inbound', $3, $4, $5, $6, $7, $8, $9, NULL, $10) RETURNING *`,
      [userId, leadId, classifiedType, downloadResult.mime_type || mimeType, saved.filename,
       saved.size_bytes, saved.storage_path, duration, metaMediaId, expiresAt]
    )

    const mediaRow = mediaResult.rows[0]

    let transcription = null
    let textForAI = caption || ''

    if (classifiedType === 'audio') {
      const features = await getPlanFeatures(pool, userId)
      if (features.ai_audio_transcription) {
        transcription = await transcriptionService.transcribe(saved.storage_path)
        if (transcription) {
          await pool.query('UPDATE media_files SET transcription = $1 WHERE id = $2', [transcription, mediaRow.id])
          textForAI = transcription
        } else {
          textForAI = `[AUDIO] ${caption || 'Mensaje de voz'} (transcripcion no disponible)`
        }
      } else {
        textForAI = `[AUDIO] ${caption || 'Mensaje de voz'} (transcripcion no incluida en tu plan)`
      }
    } else if (['document', 'image', 'video'].includes(classifiedType)) {
      textForAI = `[${classifiedType.toUpperCase()}] ${saved.filename}${caption ? ` - ${caption}` : ''}`

      if (classifiedType === 'document') {
        const ext = require('path').extname(saved.filename).toLowerCase()
        const unreadable = ['.pdf', '.xlsx', '.xls', '.doc', '.docx', '.ppt', '.pptx', '.zip', '.rar']
        if (unreadable.includes(ext)) {
          textForAI = `[DOCUMENTO: ${saved.filename}] He recibido tu archivo "${saved.filename}" pero no puedo leer su contenido. ${caption ? `Nota: ${caption}` : 'Por favor, podrías decirme qué información contiene?'}`
        }
      }
    }

    await pool.query(
      `INSERT INTO messages (lead_id, sender_type, content, message_type, media_id)
       VALUES ($1, 'client', $2, $3, $4)`,
      [leadId, textForAI || `[${classifiedType.toUpperCase()}] ${saved.filename}`, classifiedType, mediaRow.id]
    )

    if (textForAI) {
      await handleIncomingMessage(req, clientPhone, textForAI, agentPhone, clientName)
    }
  } catch (error) {
    console.error('[WhatsApp Media] Error handling media:', error)
  }
}

async function handleIncomingMessage(req, clientPhone, messageText, agentPhone, clientName) {
  const pool = req.pool
  const redis = req.redis

  if (!messageQueue) {
    messageQueue = new MessageQueue(redis, 3000)
    messageQueue.onFlush = async (queueKey, combinedMessage) => {
      const [aPhone, cPhone] = queueKey.split(':')
      await processWithAgent(cPhone, aPhone, combinedMessage)
    }
  }

  const agentExists = await checkAgentExists(pool, agentPhone)
  
  if (!agentExists) {
    console.log(`[WhatsApp] No agent found for business phone: ${agentPhone}`)
    return
  }

  // Guardar lead y mensaje en la BD para el CRM
  try {
    const agentIdResult = await pool.query(
      `SELECT id FROM agents WHERE REGEXP_REPLACE(whatsapp_config->>'phone', '\\D', '', 'g') = $1 AND is_active = true LIMIT 1`, 
      [agentPhone]
    );
    if (agentIdResult.rows.length > 0) {
      const agentId = agentIdResult.rows[0].id;
      const leadId = await getOrCreateLeadAndUpdateTimestamp(pool, agentId, clientPhone, clientName);
      await saveMessage(pool, leadId, 'client', messageText);
    }
  } catch (e) {
    console.error('[CRM] Error saving incoming message:', e);
  }

  const queueKey = `${agentPhone}:${clientPhone}`
  await messageQueue.addMessage(queueKey, messageText)
}

async function processWithAgent(clientPhone, agentPhone, messageText) {
  try {
    console.log(`[Queue] Procesando mensaje para el agente ${agentPhone} del cliente ${clientPhone}`);
    const pool = global.pool

    const agentResult = await pool.query(
      `SELECT a.*, u.id as user_id, u.plan_id
       FROM agents a 
       JOIN users u ON a.user_id = u.id 
       WHERE REGEXP_REPLACE(a.whatsapp_config->>'phone', '\\D', '', 'g') = $1 
       AND a.is_active = true 
       AND u.is_active = true`,
      [agentPhone]
    )

    if (agentResult.rows.length === 0) {
      console.log(`[Queue] Agente ${agentPhone} no encontrado o inactivo.`);
      await sendWhatsAppMessage(clientPhone, agentPhone, 'El agente no está disponible en este momento.')
      return
    }

    const agent = agentResult.rows[0]
    const userId = agent.user_id

    // Check if AI is active for this lead
    const leadCheck = await pool.query('SELECT is_ai_active FROM leads WHERE agent_id = $1 AND client_phone = $2 LIMIT 1', [agent.id, clientPhone]);
    const isAiActive = leadCheck.rows.length > 0 ? leadCheck.rows[0].is_ai_active : true;

    if (!isAiActive) {
      console.log(`[Queue] IA desactivada para el lead ${clientPhone}. Ignorando generacion de IA.`);
      return;
    }

    // Check if the lead's stage is in the agent's active stages
    const leadStageCheck = await pool.query('SELECT stage_id FROM leads WHERE agent_id = $1 AND client_phone = $2 LIMIT 1', [agent.id, clientPhone]);
    const leadStageId = leadStageCheck.rows.length > 0 ? leadStageCheck.rows[0].stage_id : null;
    if (agent.active_funnels) {
      const activeStages = typeof agent.active_funnels === 'string' ? JSON.parse(agent.active_funnels) : agent.active_funnels;
      if (Array.isArray(activeStages) && activeStages.length > 0 && leadStageId && !activeStages.includes(leadStageId)) {
        console.log(`[Queue] Lead stage ${leadStageId} not in agent's active stages. Ignoring.`);
        return;
      }
    }

    console.log(`[Queue] Agente encontrado (ID: ${agent.id}, User: ${userId}). Enviando a OpenClaw...`);

    if (!openclawService) {
      openclawService = new OpenClawService(process.env.OPENCLAW_URL)
    }

    // Build context extras: templates + media
    const contextExtras = {};

    try {
      const templates = await pool.query(
        `SELECT t.name, t.display_name, t.category, t.body_text, t.language, at.usage_context
         FROM wa_templates t
         JOIN agent_templates at ON at.template_id = t.id
         WHERE at.agent_id = $1 AND at.enabled = true AND t.status = 'APPROVED'`,
        [agent.id]
      );
      contextExtras.templateContext = templates.rows;
    } catch (e) {
      console.error('[Queue] Error fetching template context:', e);
    }

    const result = await openclawService.sendMessage(userId, messageText, agent, contextExtras)
    console.log(`[Queue] Respuesta de OpenClaw recibida:`, result.success);

    if (result.success && result.response) {
      // Check if the AI wants to send a template
      const templateMatch = result.response.match(/SEND_TEMPLATE:(\w+)/);
      let finalResponse = result.response;

      if (templateMatch) {
        finalResponse = result.response.replace(/SEND_TEMPLATE:\w+[\s]*/g, '').trim();
      }

      // Save the AI response to DB
      let savedLeadId = null;
      try {
        const leadResult = await pool.query('SELECT id FROM leads WHERE agent_id = $1 AND client_phone = $2 LIMIT 1', [agent.id, clientPhone]);
        if (leadResult.rows.length > 0) {
          savedLeadId = leadResult.rows[0].id;
          await saveMessage(pool, savedLeadId, 'agent', finalResponse);
        }
      } catch (e) {
        console.error('[CRM] Error saving outgoing message:', e);
      }

      await sendWhatsAppMessage(clientPhone, agentPhone, finalResponse)

      // Notify via Socket.io
      if (global.io && savedLeadId) {
        global.io.to(`lead:${savedLeadId}`).emit('new_message', {
          lead_id: savedLeadId,
          sender_type: 'agent',
          content: finalResponse,
          message_type: 'text'
        })
        global.io.emit('lead_updated', { lead_id: savedLeadId })
      }
    } else {
      console.error(`[Queue] Fallo en OpenClaw:`, result.error || result.response);
      await sendWhatsAppMessage(clientPhone, agentPhone, 'Lo siento, estoy teniendo problemas técnicos. Por favor intenta más tarde.')
    }

    await updateMessageCount(userId)
  } catch (error) {
    console.error(`[Queue] Error CRITICO en processWithAgent:`, error);
  }
}

async function checkAgentExists(pool, agentPhone) {
  if (!agentPhone) return false;
  
  const result = await pool.query(
    `SELECT id 
     FROM agents 
     WHERE is_active = true 
     AND REGEXP_REPLACE(whatsapp_config->>'phone', '\\D', '', 'g') = $1`,
    [agentPhone]
  )

  return result.rows.length > 0;
}

async function getOrCreateLeadAndUpdateTimestamp(pool, agentId, clientPhone, clientName) {
  const result = await pool.query(
    'SELECT id FROM leads WHERE agent_id = $1 AND client_phone = $2',
    [agentId, clientPhone]
  );
  
  if (result.rows.length > 0) {
    await pool.query('UPDATE leads SET last_client_message_at = CURRENT_TIMESTAMP WHERE id = $1', [result.rows[0].id]);
    return result.rows[0].id;
  }
  
  const insert = await pool.query(
    'INSERT INTO leads (agent_id, client_phone, name, last_client_message_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING id',
    [agentId, clientPhone, clientName]
  );
  return insert.rows[0].id;
}

async function saveMessage(pool, leadId, senderType, content, messageType = 'text', mediaId = null, templateId = null) {
  if (!content && !mediaId) return;
  const result = await pool.query(
    'INSERT INTO messages (lead_id, sender_type, content, message_type, media_id, template_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at',
    [leadId, senderType, content || '', messageType, mediaId, templateId]
  );

  // Notify via Socket.io
  if (global.io && leadId) {
    const msg = result.rows[0];
    global.io.to(`lead:${leadId}`).emit('new_message', {
      id: msg.id,
      lead_id: leadId,
      sender_type: senderType,
      content: content || '',
      message_type: messageType,
      media_id: mediaId,
      created_at: msg.created_at
    })
    global.io.emit('lead_updated', { lead_id: leadId, last_message: content?.substring(0, 100) })
  }
}

async function sendWhatsAppMessage(to, agentPhone, message) {
  try {
    const pool = global.pool
    
    const agentResult = await pool.query(
      `SELECT whatsapp_config->>'phone_number_id' as phone_number_id,
              whatsapp_config->>'access_token' as access_token
       FROM agents 
       WHERE REGEXP_REPLACE(whatsapp_config->>'phone', '\\D', '', 'g') = $1`,
      [agentPhone]
    )

    if (agentResult.rows.length === 0) {
      console.log('[WhatsApp] No agent config found for', agentPhone)
      return
    }

    const { phone_number_id, access_token } = agentResult.rows[0]

    if (!phone_number_id || !access_token) {
      console.log('[WhatsApp] Missing credentials for', agentPhone)
      return
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: message }
        })
      }
    )

    const data = await response.json()
    if (data.error) {
      console.error('[WhatsApp] Meta API Error:', JSON.stringify(data.error, null, 2))
    } else {
      console.log('[WhatsApp] Message sent to', to, 'Message ID:', data.messages?.[0]?.id)
    }
    return data
  } catch (error) {
    console.error('[WhatsApp] Send error:', error)
  }
}

async function updateMessageCount(userId) {
  const redis = global.redisClient
  const key = `user:${userId}:messages`
  
  try {
    await redis.incr(key)
    const ttl = 30 * 24 * 60 * 60
    await redis.expire(key, ttl)
  } catch (error) {
    console.error('[Redis] Error updating count:', error)
  }
}

module.exports = router
module.exports.sendWhatsAppMessage = sendWhatsAppMessage
module.exports.saveMessage = saveMessage
