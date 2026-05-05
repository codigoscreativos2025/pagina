const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')

router.get('/meta-ads', auth, async (req, res) => {
  try {
    const pool = req.pool
    const userId = req.user.id
    
    // 1. Obtener la configuración de Meta Ads del usuario
    const configRes = await pool.query('SELECT meta_ads_config FROM user_integrations WHERE user_id = $1', [userId])
    const metaConfig = configRes.rows.length > 0 ? configRes.rows[0].meta_ads_config : null;
    
    // 2. Obtener métricas reales del CRM (ej. Leads creados esta semana)
    // Para simplificar, traemos el conteo total de leads del usuario (a través de sus agentes)
    const crmLeadsRes = await pool.query(`
      SELECT COUNT(l.id) as total_leads 
      FROM leads l
      JOIN agents a ON l.agent_id = a.id
      WHERE a.user_id = $1
    `, [userId])
    
    const crmLeads = parseInt(crmLeadsRes.rows[0].total_leads || 0)

    // 3. Simular llamada a Meta Graph API o devolver estructura base
    // Si metaConfig tiene access_token, aquí se haría un fetch a 'https://graph.facebook.com/v18.0/act_<AD_ACCOUNT_ID>/insights'
    
    let metaMetrics = {
      reach: 0,
      impressions: 0,
      clicks: 0,
      spend: 0,
      connected: false
    }

    if (metaConfig && metaConfig.ad_account_id) {
      // Mock de datos para demostrar el funcionamiento cuando está conectado
      metaMetrics = {
        reach: 22450,
        impressions: 45000,
        clicks: 3200,
        spend: 150.50,
        connected: true
      }
    }

    res.json({ 
      success: true, 
      metrics: {
        meta: metaMetrics,
        crm: {
          total_leads: crmLeads,
          conversion_rate: metaMetrics.connected ? ((crmLeads / metaMetrics.clicks) * 100).toFixed(2) + '%' : '0%'
        }
      }
    })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
