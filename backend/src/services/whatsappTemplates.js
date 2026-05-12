const META_API_VERSION = 'v18.0';

class WhatsAppTemplatesService {
  constructor() {
    this.baseUrl = `https://graph.facebook.com/${META_API_VERSION}`;
  }

  _getCredentials(pool, userId) {
    return pool.query(
      `SELECT whatsapp_config FROM agents WHERE user_id = $1 AND is_active = true LIMIT 1`,
      [userId]
    ).then(r => {
      if (!r.rows.length || !r.rows[0].whatsapp_config) return null;
      const config = typeof r.rows[0].whatsapp_config === 'string'
        ? JSON.parse(r.rows[0].whatsapp_config)
        : r.rows[0].whatsapp_config;
      return {
        accessToken: config.access_token,
        phoneNumberId: config.phone_number_id,
        wabaId: config.waba_id
      };
    });
  }

  _getCredentialsFromAgent(pool, agentId) {
    return pool.query(
      `SELECT whatsapp_config FROM agents WHERE id = $1`,
      [agentId]
    ).then(r => {
      if (!r.rows.length || !r.rows[0].whatsapp_config) return null;
      const config = typeof r.rows[0].whatsapp_config === 'string'
        ? JSON.parse(r.rows[0].whatsapp_config)
        : r.rows[0].whatsapp_config;
      return {
        accessToken: config.access_token,
        phoneNumberId: config.phone_number_id,
        wabaId: config.waba_id
      };
    });
  }

  async submitTemplate(pool, userId, templateData) {
    const creds = await this._getCredentials(pool, userId);
    if (!creds || !creds.accessToken || !creds.wabaId) {
      return { success: false, error: 'WhatsApp not configured. Connect your WhatsApp Business account first.' };
    }

    const { name, language, category, components, body_text, display_name } = templateData;

    const metaCategoryMap = {
      'UTILITY': 'UTILITY',
      'MARKETING': 'MARKETING',
      'AUTHENTICATION': 'AUTHENTICATION'
    };

    const payload = {
      name,
      language,
      category: metaCategoryMap[category] || 'UTILITY',
      components
    };

    try {
      const response = await fetch(`${this.baseUrl}/${creds.wabaId}/message_templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.error) {
        console.error('[WATemplates] Meta API error submitting template:', JSON.stringify(data.error));
        return { success: false, error: data.error.message || 'Meta API error', meta_error: data.error };
      }

      return {
        success: true,
        meta_template_id: data.id,
        status: data.status || 'PENDING',
        meta_data: data
      };
    } catch (error) {
      console.error('[WATemplates] Error submitting template:', error);
      return { success: false, error: error.message };
    }
  }

  async syncTemplateStatus(pool, userId, templateId) {
    const creds = await this._getCredentials(pool, userId);
    if (!creds || !creds.accessToken) {
      return { success: false, error: 'WhatsApp not configured' };
    }

    const template = await pool.query('SELECT meta_template_id FROM wa_templates WHERE id = $1 AND user_id = $2', [templateId, userId]);
    if (!template.rows.length || !template.rows[0].meta_template_id) {
      return { success: false, error: 'Template not found or not submitted to Meta' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/${template.rows[0].meta_template_id}`, {
        headers: { 'Authorization': `Bearer ${creds.accessToken}` }
      });
      const data = await response.json();

      if (data.error) {
        return { success: false, error: data.error.message };
      }

      const status = data.status || 'UNKNOWN';
      const rejectionReason = data.rejected_reason || null;

      await pool.query(
        `UPDATE wa_templates SET status = $1, rejection_reason = $2, last_sync_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
        [status, rejectionReason, templateId]
      );

      return { success: true, status, rejection_reason: rejectionReason };
    } catch (error) {
      console.error('[WATemplates] Error syncing template:', error);
      return { success: false, error: error.message };
    }
  }

  async syncAllTemplates(pool, userId) {
    const creds = await this._getCredentials(pool, userId);
    if (!creds || !creds.accessToken || !creds.wabaId) {
      return { success: false, error: 'WhatsApp not configured' };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/${creds.wabaId}/message_templates?limit=250`,
        { headers: { 'Authorization': `Bearer ${creds.accessToken}` } }
      );
      const data = await response.json();

      if (data.error) {
        return { success: false, error: data.error.message };
      }

      const templates = data.data || [];
      let synced = 0;

      for (const tmpl of templates) {
        const localResult = await pool.query(
          `SELECT id FROM wa_templates WHERE user_id = $1 AND (meta_template_id = $2 OR name = $3)`,
          [userId, tmpl.id, tmpl.name]
        );

        const status = (tmpl.status || 'UNKNOWN').toUpperCase();
        const rejectionReason = tmpl.rejected_reason || null;

        if (localResult.rows.length > 0) {
          await pool.query(
            `UPDATE wa_templates SET status = $1, rejection_reason = $2, meta_template_id = $3, last_sync_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
            [status, rejectionReason, tmpl.id, localResult.rows[0].id]
          );
        } else {
          const components = tmpl.components || [];
          const bodyComp = components.find(c => c.type === 'BODY');
          const bodyText = bodyComp?.text || '';

          await pool.query(
            `INSERT INTO wa_templates (user_id, name, language, category, components, body_text, status, meta_template_id, rejection_reason, last_sync_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
            [userId, tmpl.name, tmpl.language, (tmpl.category || 'UTILITY').toUpperCase(),
             JSON.stringify(components), bodyText, status, tmpl.id, rejectionReason]
          );
        }
        synced++;
      }

      return { success: true, synced };
    } catch (error) {
      console.error('[WATemplates] Error syncing all templates:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteTemplate(pool, userId, templateId) {
    const creds = await this._getCredentials(pool, userId);
    if (!creds || !creds.accessToken || !creds.wabaId) {
      return { success: false, error: 'WhatsApp not configured' };
    }

    const template = await pool.query('SELECT meta_template_id, name FROM wa_templates WHERE id = $1 AND user_id = $2', [templateId, userId]);
    if (!template.rows.length) {
      return { success: false, error: 'Template not found' };
    }

    const metaId = template.rows[0].meta_template_id;
    if (!metaId) {
      await pool.query('DELETE FROM wa_templates WHERE id = $1', [templateId]);
      return { success: true };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/${creds.wabaId}/message_templates?name=${encodeURIComponent(template.rows[0].name)}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${creds.accessToken}` }
        }
      );
      const data = await response.json();

      if (data.error) {
        const metaErr = data.error;
        if (metaErr.code === 100 && metaErr.error_subcode !== 2209) {
          console.error('[WATemplates] Meta error deleting template:', JSON.stringify(metaErr));
          return { success: false, error: metaErr.message || 'Meta API error' };
        }
      }

      await pool.query('DELETE FROM wa_templates WHERE id = $1', [templateId]);
      return { success: true };
    } catch (error) {
      console.error('[WATemplates] Error deleting template:', error);
      return { success: false, error: error.message };
    }
  }

  async sendTemplateMessage(pool, userId, agentId, templateName, language, components, recipientPhone) {
    const creds = agentId
      ? await this._getCredentialsFromAgent(pool, agentId)
      : await this._getCredentials(pool, userId);

    if (!creds || !creds.accessToken || !creds.phoneNumberId) {
      return { success: false, error: 'WhatsApp not configured' };
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: recipientPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language || 'es' },
        components: components || []
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}/${creds.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.error) {
        console.error('[WATemplates] Meta API error sending template:', JSON.stringify(data.error));
        return { success: false, error: data.error.message || 'Meta API error', meta_error: data.error };
      }

      return {
        success: true,
        wa_message_id: data.messages?.[0]?.id,
        meta_data: data
      };
    } catch (error) {
      console.error('[WATemplates] Error sending template message:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new WhatsAppTemplatesService();