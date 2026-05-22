/**
 * SCRIPT PARA EJECUTAR TODAS LAS LLAMADAS DE META APP REVIEW
 * 
 * Uso: cd backend && node ../scripts/execute-meta-review-tests.js
 * 
 * Lee DATABASE_URL y otras variables del entorno (deben estar seteadas en el sistema o en .env)
 */

const { Pool } = require('pg')

// Intentar cargar .env desde diferentes ubicaciones
const fs = require('fs')
const path = require('path')

const envPaths = [
  path.join(__dirname, '..', '.env'),
  path.join(__dirname, '..', 'backend', '.env'),
  path.join(process.cwd(), '.env')
]

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`Loading .env from: ${envPath}`)
    require('dotenv').config({ path: envPath })
    break
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

async function executeAllTests() {
  console.log('🔍 ============================================')
  console.log('🔍 META APP REVIEW - EJECUCIÓN DE TESTS')
  console.log('🔍 ============================================\n')
  
  try {
    const client = await pool.connect()
    console.log('✅ Database connected\n')
    
    // Obtener usuario con Facebook conectado
    const userRes = await client.query(
      "SELECT user_id, facebook_config FROM user_integrations WHERE facebook_config IS NOT NULL LIMIT 1"
    )
    
    if (userRes.rows.length === 0) {
      console.log('❌ No hay usuarios con Facebook conectado')
      console.log('   Solución: Conecta Facebook en /integrations primero')
      client.release()
      return
    }
    
    const user = userRes.rows[0]
    const config = user.facebook_config
    const accessToken = config.access_token
    const userAccessToken = config.user_access_token || config.access_token
    const pageId = config.page_id
    
    console.log('📋 Usuario encontrado:', user.user_id)
    console.log('📋 Página:', config.page_name, `(${pageId})`)
    console.log('')
    
    // TEST 1: public_profile
    console.log('📝 TEST 1: public_profile')
    console.log('   URL: GET /me?fields=id,name,picture')
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name,picture.width(100)&access_token=${userAccessToken}`
      )
      const data = await response.json()
      
      if (data.error) {
        console.log('   ❌ FAILED:', data.error.message)
      } else {
        console.log('   ✅ SUCCESS:', data.name, `(${data.id})`)
        await client.query(
          "INSERT INTO meta_review_tests (test_name, result) VALUES ('public_profile', $1) ON CONFLICT (test_name) DO UPDATE SET executed_at = CURRENT_TIMESTAMP, result = $1",
          [JSON.stringify({ success: true, data: { id: data.id, name: data.name } })]
        )
      }
    } catch (error) {
      console.log('   ❌ ERROR:', error.message)
    }
    console.log('')
    
    // TEST 2: pages_show_list
    console.log('📝 TEST 2: pages_show_list')
    console.log('   URL: GET /me/accounts?fields=id,name,access_token')
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token&access_token=${userAccessToken}`
      )
      const data = await response.json()
      
      if (data.error) {
        console.log('   ❌ FAILED:', data.error.message)
      } else {
        console.log('   ✅ SUCCESS:', data.data?.length, 'páginas encontradas')
        data.data?.forEach((page, i) => {
          console.log(`      [${i+1}] ${page.name} (${page.id})`)
        })
        await client.query(
          "INSERT INTO meta_review_tests (test_name, result) VALUES ('pages_show_list', $1) ON CONFLICT (test_name) DO UPDATE SET executed_at = CURRENT_TIMESTAMP, result = $1",
          [JSON.stringify({ success: true, pages_count: data.data?.length || 0 })]
        )
      }
    } catch (error) {
      console.log('   ❌ ERROR:', error.message)
    }
    console.log('')
    
    // TEST 3: pages_utility_messaging
    console.log('📝 TEST 3: pages_utility_messaging')
    console.log('   URL: POST /{page-id}/messages con tag CONFIRMATION_UPDATE')
    
    const leadRes = await client.query(
      `SELECT facebook_psid, name FROM leads l
       JOIN agents a ON l.agent_id = a.id
       WHERE a.user_id = $1 AND l.facebook_psid IS NOT NULL
       LIMIT 1`,
      [user.user_id]
    )
    
    if (leadRes.rows.length === 0) {
      console.log('   ⚠️  No hay leads con facebook_psid en la base de datos')
      console.log('   SOLUCIÓN: Alguien debe enviar un mensaje a tu página primero')
    } else {
      const psid = leadRes.rows[0].facebook_psid
      const leadName = leadRes.rows[0].name
      
      console.log('   Lead encontrado:', leadName, `(${psid})`)
      
      try {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${pageId}/messages`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              recipient: { id: psid },
              message: { text: '✅ This is a test confirmation message for Meta App Review. Your appointment has been confirmed.' },
              messaging_type: 'MESSAGE_TAG',
              tag: 'CONFIRMATION_UPDATE'
            })
          }
        )
        const data = await response.json()
        
        if (data.error) {
          console.log('   ❌ FAILED:', data.error.message)
        } else {
          console.log('   ✅ SUCCESS: Message ID', data.message_id)
          console.log('   Recipient:', data.recipient_id)
          await client.query(
            "INSERT INTO meta_review_tests (test_name, result) VALUES ('utility_message', $1) ON CONFLICT (test_name) DO UPDATE SET executed_at = CURRENT_TIMESTAMP, result = $1",
            [JSON.stringify({ success: true, message_id: data.message_id, recipient_id: data.recipient_id })]
          )
        }
      } catch (error) {
        console.log('   ❌ ERROR:', error.message)
      }
    }
    console.log('')
    
    // TEST 4: instagram_manage_messages
    console.log('📝 TEST 4: instagram_manage_messages')
    console.log('   URL: POST /me/messages (Instagram DM)')
    
    const igLeadRes = await client.query(
      `SELECT instagram_psid, name FROM leads l
       JOIN agents a ON l.agent_id = a.id
       WHERE a.user_id = $1 AND l.instagram_psid IS NOT NULL
       LIMIT 1`,
      [user.user_id]
    )
    
    if (igLeadRes.rows.length === 0) {
      console.log('   ⚠️  No hay leads con instagram_psid en la base de datos')
      console.log('   SOLUCIÓN: Alguien debe enviar un DM a tu Instagram primero')
    } else {
      const igUserId = igLeadRes.rows[0].instagram_psid
      const igName = igLeadRes.rows[0].name
      
      console.log('   Instagram user encontrado:', igName, `(${igUserId})`)
      
      try {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: { id: igUserId },
              message: { text: '✅ Test message for Meta App Review - instagram_manage_messages' }
            })
          }
        )
        const data = await response.json()
        
        if (data.error) {
          console.log('   ❌ FAILED:', data.error.message)
        } else {
          console.log('   ✅ SUCCESS: Message ID', data.message_id)
          await client.query(
            "INSERT INTO meta_review_tests (test_name, result) VALUES ('ig_manage_messages', $1) ON CONFLICT (test_name) DO UPDATE SET executed_at = CURRENT_TIMESTAMP, result = $1",
            [JSON.stringify({ success: true, message_id: data.message_id })]
          )
        }
      } catch (error) {
        console.log('   ❌ ERROR:', error.message)
      }
    }
    console.log('')
    
    // Resumen
    console.log('📊 ============================================')
    console.log('📊 RESUMEN DE TESTS EJECUTADOS')
    console.log('📊 ============================================')
    
    const testsRes = await client.query(
      "SELECT test_name, executed_at, result FROM meta_review_tests ORDER BY test_name"
    )
    
    const tests = {
      'public_profile': { label: 'public_profile', required: true },
      'pages_show_list': { label: 'pages_show_list', required: true },
      'utility_message': { label: 'pages_utility_messaging', required: true },
      'ig_manage_messages': { label: 'instagram_manage_messages', required: true }
    }
    
    testsRes.rows.forEach(row => {
      if (tests[row.test_name]) {
        const result = typeof row.result === 'string' ? JSON.parse(row.result) : row.result
        const status = result.success ? '✅' : '❌'
        console.log(`${status} ${tests[row.test_name].label}`)
        console.log(`   Ejecutado: ${row.executed_at}`)
      }
    })
    
    const completed = testsRes.rows.filter(r => tests[r.test_name]).length
    const required = Object.keys(tests).length
    
    console.log('')
    console.log(`📈 Progreso: ${completed}/${required} tests completados`)
    
    if (completed === required) {
      console.log('')
      console.log('🎉 ¡TODOS LOS TESTS COMPLETADOS!')
      console.log('   Ahora puedes enviar tu app para revisión en Meta.')
    }
    
    client.release()
    console.log('')
    console.log('✅ Database connection closed')
    
  } catch (error) {
    console.error('❌ ERROR:', error.message)
    console.error(error.stack)
  } finally {
    await pool.end()
  }
}

executeAllTests()
