# 🔧 ACCIONES REQUERIDAS - Webhook Facebook Messenger

## ✅ Lo que YA hice (código subido a GitHub):

1. ✅ Agregué `app.set('trust proxy', 1)` para que Express confíe en nginx/EasyPanel
2. ✅ Preservé el raw body para verificación de firma de Facebook
3. ✅ Agregué verificación de firma HMAC-SHA256 (opcional, solo logging)
4. ✅ Mejoré el logging del webhook para debugging
5. ✅ Agregué endpoint `/api/integrations/facebook/webhook-diagnostic`

---

## 🔴 LO QUE TIENES QUE HACER TÚ (Manualmente):

### PASO 1: Reiniciar backend en EasyPanel

1. Ve a EasyPanel
2. Selecciona `agents-api`
3. Haz clic en **Restart**
4. Espera 10 segundos

---

### PASO 2: Agregar variables de entorno en EasyPanel

En EasyPanel → `agents-api` → Environment, agregar:

```
FRONTEND_URL=https://agents.pivotsoluciones.com
FACEBOOK_VERIFY_TOKEN=pivot_verify_token_2024
```

Luego **Restart** del contenedor.

---

### PASO 3: Verificar webhook en Meta Developers

1. Ve a https://developers.facebook.com/
2. Selecciona tu app
3. Ve a **Webhooks** (menú izquierdo)
4. Verifica que esté configurado:
   - **Callback URL:** `https://agents.pivotsoluciones.com/api/integrations/facebook/webhook`
   - **Verify Token:** `pivot_verify_token_2024`
   - **Estado:** ✅ Activo

**Si no está configurado:**
1. Haz clic en **Add Subscription** o **Edit**
2. Callback URL: `https://agents.pivotsoluciones.com/api/integrations/facebook/webhook`
3. Verify Token: `pivot_verify_token_2024`
4. Suscríbete a: `messages`, `messaging_postbacks`, `messaging_optins`, `messaging_referrals`

---

### PASO 4: Suscribir la App a tu Página (⚠️ CRÍTICO)

**Opción A: Desde tu plataforma (Más fácil)**
1. Ve a `https://agents.pivotsoluciones.com/integrations`
2. Inicia sesión
3. En Facebook Messenger, si está conectado haz clic en **🔄 Re-suscribir**

**Opción B: Desde Graph API Explorer**
1. Ve a https://developers.facebook.com/tools/explorer/
2. Selecciona tu app
3. Genera un Page Access Token para tu página
4. Ejecuta:
```
POST /{PAGE_ID}/subscribed_apps
Body: {"subscribed_fields": ["messages", "messaging_postbacks", "messaging_optins", "messaging_referrals"]}
```

**Resultado esperado:** `{"success": true}`

---

### PASO 5: Verificar que funciona

**Opción A: Usar el endpoint de diagnóstico**
1. Ve a `https://agents.pivotsoluciones.com/integrations`
2. En Facebook Messenger, haz clic en **🔍 Diagnosticar**
3. O llama a: `GET /api/integrations/facebook/webhook-diagnostic`

**Opción B: Enviar un mensaje de prueba**
1. Abre Facebook desde otra cuenta personal
2. Busca tu Página
3. Envía un mensaje: "Hola"
4. Revisa los logs del backend en EasyPanel

**Deberías ver en logs:**
```
[Webhook] ====== FACEBOOK/INSTAGRAM WEBHOOK RECEIVED ======
[Webhook] Object type: page
[Webhook] Processing Facebook Messenger event...
```

**Opción C: Usar herramienta de Meta**
1. En Meta Developers → Webhooks
2. Haz clic en **Test** junto a tu webhook
3. Meta enviará un evento de prueba
4. Revisa los logs del backend

---

## 🐛 Si TODAVÍA no llegan mensajes:

### Verificar logs del backend en EasyPanel

Busca estos mensajes:
- `[Facebook Webhook GET] Mode: subscribe` → Webhook verification
- `[Webhook] ====== FACEBOOK/INSTAGRAM WEBHOOK RECEIVED ======` → Webhook recibido
- `[Facebook Handler] Message from {ID}: {texto}` → Mensaje procesado

**Si NO ves `[Webhook] ====== FACEBOOK...`:**
- Facebook NO está enviando el webhook
- Revisa PASO 3 y PASO 4

**Si SÍ ves los logs pero hay errores:**
- Revisa el mensaje de error específico
- Posible causa: No hay agente activo para esa página

---

## 📋 Checklist rápido

- [ ] Backend reiniciado en EasyPanel
- [ ] Variables `FRONTEND_URL` y `FACEBOOK_VERIFY_TOKEN` agregadas
- [ ] Webhook configurado en Meta Developers
- [ ] App suscrita a la Página (PASO 4 - EL MÁS IMPORTANTE)
- [ ] Mensaje de prueba enviado desde Facebook
- [ ] Logs del backend muestran el webhook recibido

---

## 🆘 Comandos útiles

### Probar webhook verification (GET):
```bash
curl -v "https://agents.pivotsoluciones.com/api/integrations/facebook/webhook?hub.mode=subscribe&hub.verify_token=pivot_verify_token_2024&hub.challenge=test123"
```
**Resultado esperado:** `test123`

### Probar webhook POST (simular Facebook):
```bash
curl -X POST "https://agents.pivotsoluciones.com/api/integrations/facebook/webhook" \
  -H "Content-Type: application/json" \
  -d '{"object":"page","entry":[{"id":"TEST","time":1234567890,"messaging":[{"sender":{"id":"SENDER"},"recipient":{"id":"PAGE"},"timestamp":1234567890,"message":{"text":"Test"}}]}]}'
```
**Resultado esperado:** `EVENT_RECEIVED`

### Verificar suscripción en Graph API:
```bash
curl "https://graph.facebook.com/v18.0/{PAGE_ID}/subscribed_apps?access_token={PAGE_ACCESS_TOKEN}"
```
**Resultado esperado:** `{"data": [{"subscribed_fields": [...]}]}`

---

**Una vez completados todos los pasos, los mensajes de Facebook deberían llegar al CRM automáticamente.**
