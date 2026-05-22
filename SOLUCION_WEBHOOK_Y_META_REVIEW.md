# Solución Webhook Facebook + Tests Meta App Review

## 📋 Resumen de Cambios

### 1. Tests Meta App Review Implementados

Se han implementado tests automáticos para **todos los permisos pendientes**:

| Test | Permission | Estado |
|------|------------|--------|
| `utility_message` | `pages_utility_messaging` | ✅ Auto-ejecuta al iniciar backend |
| `ig_manage_messages` | `instagram_business_manage_messages` | ✅ Auto-ejecuta al iniciar backend |
| `ig_manage_insights` | `instagram_manage_insights` | ✅ Auto-ejecuta al iniciar backend |
| `ig_manage_comments` | `instagram_manage_comments` | ✅ Auto-ejecuta al iniciar backend |
| `ig_content_publish` | `instagram_content_publish` | ✅ Auto-ejecuta al iniciar backend |

### 2. Nuevos Endpoints Backend

#### Verificar estado de tests Meta Review
```bash
GET /api/integrations/meta-review-status
Headers: Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "tests": [
    { "label": "pages_utility_messaging", "executed": true, "executed_at": "2024-01-01T00:00:00Z" },
    { "label": "instagram_business_manage_messages", "executed": false },
    ...
  ],
  "totalCompleted": 3,
  "totalRequired": 5
}
```

#### Ejecutar tests manualmente (opcional)
```bash
# Facebook utility message
POST /api/integrations/test-utility-message

# Instagram permissions
POST /api/integrations/test-instagram/manage_messages
POST /api/integrations/test-instagram/manage_comments
POST /api/integrations/test-instagram/manage_insights
POST /api/integrations/test-instagram/content_publish
```

#### Diagnosticar webhook
```bash
GET /api/integrations/facebook/webhook-status
```

#### Re-suscribir webhooks (si no llegan mensajes)
```bash
POST /api/integrations/facebook/resubscribe-webhooks
```

---

## 🔧 SOLUCIÓN: Webhook Facebook no recibe mensajes

### Problema Común
Los mensajes de Facebook no llegan al webhook porque:
1. El webhook no está suscrito correctamente a los campos necesarios
2. EasyPanel bloquea conexiones externas
3. El verify token no coincide

### Pasos para Solucionar

#### Paso 1: Verificar que el webhook esté configurado en Meta

1. Ve a [Meta Developers](https://developers.facebook.com/)
2. Selecciona tu app
3. Ve a **Webhooks** en el menú izquierdo
4. Verifica que:
   - **Callback URL**: `https://agents.pivotsoluciones.com/api/integrations/facebook/webhook`
   - **Verify Token**: `pivot_verify_token_2024`
   - **Status**: ✅ Active

#### Paso 2: Suscribirse a los campos correctos

En la misma página de Webhooks:
1. Haz clic en **Add Subscription** o **Edit**
2. Suscríbete a estos campos:
   - ✅ `messages`
   - ✅ `messaging_postbacks`
   - ✅ `messaging_optins`
   - ✅ `messaging_referrals`

#### Paso 3: Verificar suscripción a nivel de Página

El webhook debe estar suscrito **tanto a nivel de App como a nivel de Página**:

1. Ve a tu **Facebook Page** → **Settings** → **Advanced Messaging**
2. O usa Graph API Explorer:
   ```
   POST /{page-id}/subscribed_apps
   {
     "subscribed_fields": ["messages", "messaging_postbacks", "messaging_optins", "messaging_referrals"],
     "access_token": "{page-access-token}"
   }
   ```

#### Paso 4: Probar el webhook manualmente

Desde tu terminal:
```bash
curl -X POST https://agents.pivotsoluciones.com/api/integrations/facebook/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "page",
    "entry": [{
      "id": "TEST_PAGE_ID",
      "time": 1234567890,
      "messaging": [{
        "sender": { "id": "TEST_SENDER_ID" },
        "recipient": { "id": "TEST_PAGE_ID" },
        "timestamp": 1234567890,
        "message": { "text": "Test message" }
      }]
    }]
  }'
```

#### Paso 5: Verificar logs del backend

Después de reiniciar el backend, envía un mensaje de prueba a tu página de Facebook y revisa los logs:

```bash
# Si tienes acceso SSH al servidor
tail -f /var/log/pivot-backend.log | grep -i webhook

# O desde EasyPanel, usa la consola del contenedor
```

Deberías ver logs como:
```
[Facebook Webhook] Message from 123456789: Hello
[Facebook Webhook] Created new lead: 456 (John)
```

---

## 🚀 Instrucciones para Reiniciar Backend

### Desde EasyPanel:
1. Ve a tu panel de EasyPanel
2. Selecciona el servicio `pivot-backend`
3. Haz clic en **Restart**

### Verificar que los tests se ejecutaron:
```bash
# Conecta a la base de datos
psql -h <host> -U <user> -d <database>

# Consulta los tests ejecutados
SELECT * FROM meta_review_tests ORDER BY executed_at DESC;
```

---

## 📝 Checklist para Meta App Review

### Antes de enviar a revisión:

- [ ] Todos los tests muestran `executed: true` en `/api/integrations/meta-review-status`
- [ ] Tienes al menos 1 lead con Facebook PSID en la base de datos
- [ ] Tienes al menos 1 lead con Instagram PSID en la base de datos
- [ ] El webhook está activo y verificable en Meta Developers
- [ ] Has probado enviar y recibir mensajes de Facebook manualmente

### Videos para Meta Review:

Para cada permiso, necesitas grabar un video mostrando:

1. **pages_utility_messaging**: 
   - Mostrar mensaje de confirmación enviado con tag `CONFIRMATION_UPDATE`
   - Explicar que es para confirmaciones de citas

2. **instagram_business_manage_messages**:
   - Mostrar recepción y respuesta a DM de Instagram
   - Mostrar cómo el AI responde automáticamente

3. **instagram_manage_comments**:
   - Mostrar lectura de comentarios en publicaciones
   - Explicar uso para moderación

4. **instagram_manage_insights**:
   - Mostrar métricas de Instagram (followers, reach, impressions)
   - Explicar uso para analytics

5. **instagram_content_publish**:
   - Mostrar capacidad de publicar en Instagram
   - Explicar uso para posting automático

---

## 🆘 Solución de Problemas

### "No Facebook leads found"
**Problema**: El test automático no encuentra leads con PSID.

**Solución**:
1. Alguien debe enviar un mensaje a tu página de Facebook primero
2. O usa Graph API Explorer para crear un lead de prueba:
   ```
   POST /{page-id}/messages
   {
     "recipient": { "id": "{psid}" },
     "message": { "text": "test" }
   }
   ```

### "Webhook verification failed"
**Problema**: Meta no puede verificar el webhook.

**Solución**:
1. Verifica que el verify token en Meta sea exactamente: `pivot_verify_token_2024`
2. Asegúrate de que la URL sea accesible públicamente (no localhost)
3. Prueba la URL desde tu navegador: `https://agents.pivotsoluciones.com/api/integrations/facebook/webhook?hub.mode=subscribe&hub.verify_token=pivot_verify_token_2024&hub.challenge=test`

### "Instagram not connected"
**Problema**: El test de Instagram falla porque no hay conexión.

**Solución**:
1. Conecta Instagram desde el frontend (página Integraciones)
2. Asegúrate de que sea una cuenta **Instagram Business**
3. Verifica que el access token tenga los permisos necesarios

---

## 📞 Soporte

Si después de seguir estos pasos los mensajes de Facebook siguen sin llegar:

1. Verifica los logs del backend en busca de errores
2. Usa la herramienta **Test Webhook** en Meta Developers
3. Revisa que el page access token no haya expirado
4. Contacta a soporte técnico
