# 📘 Guía Completa: Meta App Review + Solución Webhook Facebook

## ✅ Implementado

### 1. Tests Automáticos de Meta App Review

El backend ahora ejecuta automáticamente **5 tests** al iniciar:

| Test | Permission | API Call Required |
|------|------------|-------------------|
| `utility_message` | `pages_utility_messaging` | ✅ Enviar mensaje con tag |
| `ig_manage_messages` | `instagram_business_manage_messages` | ✅ Enviar DM |
| `ig_manage_insights` | `instagram_manage_insights` | ✅ Fetch insights |
| `ig_manage_comments` | `instagram_manage_comments` | ✅ Fetch comments |
| `ig_content_publish` | `instagram_content_publish` | ✅ Check publishing |

### 2. Endpoints Backend Creados

```bash
# Ver estado de todos los tests
GET /api/integrations/meta-review-status

# Ejecutar tests manualmente (opcional)
POST /api/integrations/test-utility-message
POST /api/integrations/test-instagram/manage_messages
POST /api/integrations/test-instagram/manage_comments
POST /api/integrations/test-instagram/manage_insights
POST /api/integrations/test-instagram/content_publish

# Diagnosticar webhook
GET /api/integrations/facebook/webhook-status

# Re-suscribir webhooks (si no llegan mensajes)
POST /api/integrations/facebook/resubscribe-webhooks
```

### 3. Frontend Actualizado

En la página **Integraciones** ahora ves:

- 📊 Panel de estado de Meta App Review
- ✅ Tests completados con fecha/hora
- 🔘 Botón "Ejecutar" para tests pendientes
- 🔍 Botón "Diagnosticar" para Facebook webhook
- 🔄 Botón "Re-suscribir" para webhooks

---

## 🚀 Instrucciones Paso a Paso

### Paso 1: Reiniciar el Backend

```bash
# En tu servidor (EasyPanel o SSH)
# Reinicia el contenedor del backend
```

Al reiniciar, verás en los logs:
```
[Meta Review] Executing pages_utility_messaging test...
[Meta Review] Executing instagram_business_manage_messages test...
[Meta Review] Executing instagram_manage_insights test...
[Meta Review] Executing instagram_manage_comments test...
[Meta Review] Executing instagram_content_publish test...
```

### Paso 2: Verificar Estado de Tests

1. Ve a `https://agents.pivotsoluciones.com/integrations`
2. Baja hasta la sección **"📋 Meta App Review - Estado de Tests"**
3. Verifica que todos muestren **✅ Ejecutado**

Si algún test está **⏳ Pendiente**:
- Haz clic en **"Ejecutar"**
- O reinicia el backend nuevamente

### Paso 3: Solucionar Webhook Facebook (si no llegan mensajes)

#### Opción A: Desde el Frontend

1. Ve a **Integraciones**
2. En la tarjeta **Facebook Messenger**, haz clic en:
   - **🔍 Diagnosticar**: Verifica configuración
   - **🔄 Re-suscribir**: Actualiza suscripción en Meta

#### Opción B: Desde Meta Developers

1. Ve a [Meta Developers](https://developers.facebook.com/)
2. Selecciona tu app
3. **Webhooks** → Verifica:
   - **Callback URL**: `https://agents.pivotsoluciones.com/api/integrations/facebook/webhook`
   - **Verify Token**: `pivot_verify_token_2024`
   - **Status**: ✅ Active

4. Haz clic en **Edit** y suscríbete a:
   - ✅ `messages`
   - ✅ `messaging_postbacks`
   - ✅ `messaging_optins`
   - ✅ `messaging_referrals`

#### Opción C: Re-suscribir a nivel de Página

Usa Graph API Explorer:

```
POST /{page-id}/subscribed_apps
{
  "subscribed_fields": ["messages", "messaging_postbacks", "messaging_optins", "messaging_referrals"],
  "access_token": "{page-access-token}"
}
```

### Paso 4: Probar Recepción de Mensajes

1. Envía un mensaje a tu página de Facebook desde otra cuenta
2. Revisa los logs del backend
3. Deberías ver:
   ```
   [Facebook Webhook] Message from 123456789: Hola
   [Facebook Webhook] Created new lead: 456 (John)
   ```

4. Verifica en el **CRM** que el lead se creó

---

## 📋 Checklist para Meta App Review

### Antes de Enviar a Revisión

- [ ] Todos los 5 tests muestran **✅ Ejecutado**
- [ ] Tienes al menos 1 lead con **Facebook PSID** en la DB
- [ ] Tienes al menos 1 lead con **Instagram PSID** en la DB
- [ ] El webhook está **activo y verificable** en Meta Developers
- [ ] Has probado enviar/recibir mensajes manualmente

### Videos Requeridos

Para cada permiso, graba un video de 2-3 minutos mostrando:

#### 1. `pages_utility_messaging`
- Muestra el endpoint `/api/integrations/meta-review-status`
- Explica: "Este test envía un mensaje de confirmación de cita con el tag `CONFIRMATION_UPDATE`"
- Muestra en la DB que el test se ejecutó

#### 2. `instagram_business_manage_messages`
- Muestra un lead de Instagram en el CRM
- Explica: "Recibimos DMs de Instagram y respondemos con AI automáticamente"
- Muestra los mensajes en el CRM

#### 3. `instagram_manage_comments`
- Ve a Graph API Explorer
- Ejecuta: `GET /{ig-account-id}/media?fields=id`
- Luego: `GET /{media-id}/comments`
- Explica: "Usamos esto para moderar comentarios en publicaciones"

#### 4. `instagram_manage_insights`
- Ve a Graph API Explorer
- Ejecuta: `GET /{ig-account-id}/insights?metric=follower_count,impressions,reach`
- Explica: "Mostramos métricas de Instagram en el dashboard de analytics"

#### 5. `instagram_content_publish`
- Ve a Graph API Explorer
- Ejecuta: `GET /{ig-account-id}?fields=media_limit,media_count`
- Explica: "Permitimos publicar contenido en Instagram automáticamente"

---

## 🆘 Solución de Problemas

### "No Facebook leads found"

**Causa**: No hay nadie que haya enviado mensaje a tu página.

**Solución**:
1. Pide a alguien que envíe un mensaje a tu página
2. O usa Graph API Explorer para simular:
   ```
   POST /{page-id}/messages
   {
     "recipient": { "id": "{psid}" },
     "message": { "text": "test" }
   }
   ```

### "No Instagram users found"

**Causa**: No hay DMs de Instagram.

**Solución**:
1. Pide a alguien que envíe un DM a tu Instagram
2. Asegúrate de que sea cuenta **Instagram Business**

### "Webhook verification failed"

**Causa**: El verify token no coincide o la URL no es accesible.

**Solución**:
1. Verifica que el token en Meta sea exactamente: `pivot_verify_token_2024`
2. Prueba la URL desde tu navegador:
   ```
   https://agents.pivotsoluciones.com/api/integrations/facebook/webhook?hub.mode=subscribe&hub.verify_token=pivot_verify_token_2024&hub.challenge=test
   ```
3. Debería devolver: `test`

### "Test ya ejecutado pero no aparece en Meta"

**Causa**: Meta necesita ver la llamada en su dashboard.

**Solución**:
1. Ejecuta el test manualmente desde el frontend
2. Ve a [Meta Developers](https://developers.facebook.com/)
3. **App Review** → **Permissions**
4. Haz clic en el permiso y verifica que muestre **"Used"**

---

## 📊 Comandos Útiles

### Ver tests en la base de datos

```sql
SELECT test_name, executed_at, result FROM meta_review_tests ORDER BY executed_at DESC;
```

### Ver leads con Facebook PSID

```sql
SELECT id, name, facebook_psid, created_at FROM leads WHERE facebook_psid IS NOT NULL;
```

### Ver leads con Instagram PSID

```sql
SELECT id, name, instagram_psid, created_at FROM leads WHERE instagram_psid IS NOT NULL;
```

### Limpiar tests (para re-ejecutar)

```sql
DELETE FROM meta_review_tests;
```

---

## 📞 Soporte

Si después de seguir esta guía los problemas persisten:

1. **Revisa los logs del backend** en busca de errores
2. **Usa la herramienta Test Webhook** en Meta Developers
3. **Verifica que los access tokens no hayan expirado**
4. **Contacta a soporte técnico**

---

## 🎯 Próximo Paso

Una vez que todos los tests estén completados:

1. ✅ Graba los 5 videos requeridos
2. ✅ Completa las respuestas en Meta App Review
3. ✅ Envía la aplicación para revisión
4. ⏳ Espera aprobación (3-10 días hábiles)

¡Listo para producción! 🚀
