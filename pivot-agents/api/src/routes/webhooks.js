const express = require('express')
const router = express.Router()
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
    
    console.log('[WhatsApp] Received message:', { from, text, type })
    
    await handleIncomingMessage(req, from, text)
    
    res.sendStatus(200)
  } catch (error) {
    console.error('[WhatsApp] Webhook error:', error)
    res.sendStatus(200)
  }
})

async function handleIncomingMessage(req, clientPhone, messageText) {
  const pool = req.pool
  const redis = req.redis

  if (!messageQueue) {
    messageQueue = new MessageQueue(redis, 3000)
    messageQueue.onFlush = async (phoneNumber, combinedMessage) => {
      await processWithAgent(req, clientPhone, phoneNumber, combinedMessage)
    }
  }

  const agentPhone = await findAgentByPhone(pool, clientPhone)
  
  if (!agentPhone) {
    await sendWhatsAppMessage(req, clientPhone, '¡Hola! Para usar el servicio de IA, el negocio debe tener un agente configurado en Pivot Agents.')
    return
  }

  await messageQueue.addMessage(agentPhone, messageText)
}

async function processWithAgent(req, clientPhone, agentPhone, messageText) {
  const pool = req.pool

  const agentResult = await pool.query(
    `SELECT a.*, u.id as user_id 
     FROM agents a 
     JOIN users u ON a.user_id = u.id 
     WHERE a.whatsapp_config->>'phone' = $1 
     AND a.is_active = true 
     AND u.is_active = true`,
    [agentPhone]
  )

  if (agentResult.rows.length === 0) {
    await sendWhatsAppMessage(req, clientPhone, 'El agente no está disponible en este momento.')
    return
  }

  const agent = agentResult.rows[0]
  const userId = agent.user_id

  if (!openclawService) {
    openclawService = new OpenClawService(process.env.OPENCLAW_URL)
  }

  const result = await openclawService.sendMessage(userId, messageText, agent)

  if (result.success && result.response) {
    await sendWhatsAppMessage(req, clientPhone, result.response)
  } else {
    await sendWhatsAppMessage(req, clientPhone, 'Lo siento, estoy teniendo problemas técnicos. Por favor intenta más tarde.')
  }

  await updateMessageCount(req, userId)
}

async function findAgentByPhone(pool, clientPhone) {
  const result = await pool.query(
    `SELECT whatsapp_config->>'phone' as phone 
     FROM agents 
     WHERE is_active = true 
     AND whatsapp_config IS NOT NULL`
  )

  for (const row of result.rows) {
    if (row.phone === clientPhone) {
      return row.phone
    }
  }

  return null
}

async function sendWhatsAppMessage(req, to, message) {
  try {
    const pool = req.pool
    
    const agentResult = await pool.query(
      `SELECT whatsapp_config->>'phone_number_id' as phone_number_id,
              whatsapp_config->>'access_token' as access_token
       FROM agents 
       WHERE whatsapp_config->>'phone' = $1`,
      [to]
    )

    if (agentResult.rows.length === 0) {
      console.log('[WhatsApp] No agent config found for', to)
      return
    }

    const { phone_number_id, access_token } = agentResult.rows[0]

    if (!phone_number_id || !access_token) {
      console.log('[WhatsApp] Missing credentials for', to)
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

async function updateMessageCount(req, userId) {
  const redis = req.redis
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
