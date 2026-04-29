const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const MessageQueue = require('../services/messageQueue')
const OpenClawService = require('../services/openclawService')

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

    // 2. Extraer Phone Number ID
    const phoneRes = await fetch(`https://graph.facebook.com/v18.0/${wabaId}/phone_numbers?access_token=${access_token}`);
    const phoneData = await phoneRes.json();
    if (!phoneData.data || phoneData.data.length === 0) {
      return res.status(400).json({ error: 'No se encontró un número de teléfono en la cuenta WABA.' });
    }
    const phoneNumberId = phoneData.data[0].id;

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
    
    let wtsConfig = { phone_number_id: phoneNumberId, access_token: access_token };
    
    if (agentExist.rows.length > 0) {
      const oldConfig = agentExist.rows[0].whatsapp_config || {};
      wtsConfig = { ...oldConfig, ...wtsConfig };
      await pool.query('UPDATE agents SET whatsapp_config = $1, is_active = true WHERE user_id = $2', [JSON.stringify(wtsConfig), req.user.id]);
    } else {
      await pool.query(`INSERT INTO agents (user_id, name, whatsapp_config) VALUES ($1, 'Nuevo Agente', $2)`, [req.user.id, JSON.stringify(wtsConfig)]);
    }

    console.log('[Meta Onboarding] Completado exitosamente para user:', req.user.id);
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
    const text = message.text?.body
    const type = message.type
    const agentPhone = value?.metadata?.display_phone_number
    
    console.log('[WhatsApp] Received message:', { from, agentPhone, text, type })
    
    await handleIncomingMessage(req, from, text, agentPhone)
    
    res.sendStatus(200)
  } catch (error) {
    console.error('[WhatsApp] Webhook error:', error)
    res.sendStatus(200)
  }
})

async function handleIncomingMessage(req, clientPhone, messageText, agentPhone) {
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

  const queueKey = `${agentPhone}:${clientPhone}`
  await messageQueue.addMessage(queueKey, messageText)
}

async function processWithAgent(clientPhone, agentPhone, messageText) {
  try {
    console.log(`[Queue] Procesando mensaje para el agente ${agentPhone} del cliente ${clientPhone}`);
    const pool = global.pool

    const agentResult = await pool.query(
      `SELECT a.*, u.id as user_id 
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
    console.log(`[Queue] Agente encontrado (ID: ${agent.id}, User: ${userId}). Enviando a OpenClaw...`);

    if (!openclawService) {
      openclawService = new OpenClawService(process.env.OPENCLAW_URL)
    }

    const result = await openclawService.sendMessage(userId, messageText, agent)
    console.log(`[Queue] Respuesta de OpenClaw recibida:`, result.success);

    if (result.success && result.response) {
      await sendWhatsAppMessage(clientPhone, agentPhone, result.response)
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
    console.log('[WhatsApp] Message sent to', to)
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
