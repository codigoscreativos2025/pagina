const cron = require('node-cron');
// const api = require('./api'); // Para posibles integraciones con WhatsApp API si es necesario

let cronTask = null;

const startEngine = () => {
  console.log('🤖 Iniciando Motor de Automatizaciones PIBots...');
  
  // Se ejecuta cada minuto
  cronTask = cron.schedule('* * * * *', async () => {
    try {
      if (!global.pool) return;
      const client = await global.pool.connect();
      
      // 1. Obtener todos los bots activos del tipo 'schedule' (por horas)
      const botsRes = await client.query(`
        SELECT * FROM pi_bots 
        WHERE is_active = true 
        AND trigger_type = 'schedule'
      `);
      
      const bots = botsRes.rows;
      if (bots.length === 0) {
        client.release();
        return;
      }

      // TODO: Aquí se implementa la lógica robusta de cada bot.
      // Por ejemplo:
      // Para cada bot, verificar su 'schedule_cron' (ej: '0 10 * * *' para las 10 AM)
      // Si coincide con la hora actual, ejecutar sus 'actions' (JSONB).
      // Las acciones pueden ser: buscar leads en etapa X, enviar plantilla Y por WhatsApp.

      // console.log(`Evaluando ${bots.length} PIBots...`);

      client.release();
    } catch (err) {
      console.error('Error en Cron Engine:', err);
    }
  });
};

const stopEngine = () => {
  if (cronTask) {
    cronTask.stop();
    console.log('🛑 Motor de Automatizaciones Detenido.');
  }
};

module.exports = {
  startEngine,
  stopEngine
};
