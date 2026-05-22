# ✅ META APP REVIEW - INSTRUCCIONES PARA EJECUTAR LAS 4 LLAMADAS

## 📋 Resumen

Meta requiere que ejecutes **4 llamadas API** para verificar tu app. Aquí están las soluciones:

---

## 🚀 MÉTODO RECOMENDADO: Frontend

### Paso 1: Reiniciar el Backend

Reinicia el backend en EasyPanel para que cargue los nuevos endpoints.

### Paso 2: Ir a Integraciones

1. Ve a `https://agents.pivotsoluciones.com/integrations`
2. Inicia sesión
3. Baja hasta la sección **"📋 Meta App Review - Estado de Tests"**

### Paso 3: Ejecutar Tests

Verás una tabla con los 4 permisos requeridos:

| Permiso | Botón |
|---------|-------|
| 📘 public_profile | Haz clic en **"Ejecutar"** |
| 📘 pages_show_list | Haz clic en **"Ejecutar"** |
| 📘 pages_utility_messaging | Haz clic en **"Ejecutar"** |
| 📷 instagram_manage_messages | Haz clic en **"Ejecutar"** |

### Paso 4: Verificar

Cada test debería cambiar a:
- ✅ **Ejecutado** con fecha/hora

---

## ⚠️ SI LOS TESTS FALLAN

### Error: "No Facebook leads found"

**Causa:** No hay nadie que te haya enviado mensaje a tu página.

**Solución:**
1. Abre Facebook desde otra cuenta
2. Envía un mensaje a tu página
3. Espera a que llegue al backend (revisa los logs)
4. Vuelve a ejecutar el test

### Error: "No Instagram users found"

**Causa:** No hay DMs de Instagram.

**Solución:**
1. Abre Instagram desde otra cuenta
2. Envía un DM a tu cuenta de Instagram Business
3. Vuelve a ejecutar el test

### Error: "Facebook not connected"

**Causa:** No has conectado Facebook en Integraciones.

**Solución:**
1. Ve a Integraciones
2. Haz clic en **"Conectar con Facebook"** en Facebook Messenger
3. Autoriza los permisos
4. Selecciona tu página
5. Vuelve a ejecutar los tests

---

## 🔧 MÉTODO ALTERNATIVO: cURL

Si el frontend no funciona, usa cURL:

### 1. Obtener Token

```bash
curl -X POST https://agents.pivotsoluciones.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"TU_EMAIL","password":"TU_PASSWORD"}'
```

Copia el `token` de la respuesta.

### 2. Ejecutar Tests

```bash
# public_profile
curl -X POST https://agents.pivotsoluciones.com/api/integrations/test-public-profile \
  -H "Authorization: Bearer TU_TOKEN"

# pages_show_list
curl -X POST https://agents.pivotsoluciones.com/api/integrations/test-pages-show-list \
  -H "Authorization: Bearer TU_TOKEN"

# pages_utility_messaging
curl -X POST https://agents.pivotsoluciones.com/api/integrations/test-utility-message \
  -H "Authorization: Bearer TU_TOKEN"

# instagram_manage_messages
curl -X POST https://agents.pivotsoluciones.com/api/integrations/test-instagram/manage_messages \
  -H "Authorization: Bearer TU_TOKEN"
```

---

## 🛠️ MÉTODO MANUAL: Graph API Explorer

Si nada funciona, usa [Graph API Explorer](https://developers.facebook.com/tools/explorer/):

### 1. public_profile
```
GET /me?fields=id,name,picture
```

### 2. pages_show_list
```
GET /me/accounts?fields=id,name,access_token
```

### 3. pages_utility_messaging
```
POST /{page-id}/messages
{
  "recipient": { "id": "{psid}" },
  "message": { "text": "Test message for Meta App Review" },
  "messaging_type": "MESSAGE_TAG",
  "tag": "CONFIRMATION_UPDATE"
}
```

### 4. instagram_manage_messages
```
POST /me/messages
{
  "recipient": { "id": "{instagram-user-id}" },
  "message": { "text": "Test message for Meta App Review" }
}
```

---

## ✅ Verificación Final

Después de ejecutar los tests:

1. Ve a [Meta Developers](https://developers.facebook.com/)
2. Tu App → **App Review** → **Permissions**
3. Verifica que cada permiso diga **"Used"**

---

## 📊 Ver Estado desde la API

```bash
curl https://agents.pivotsoluciones.com/api/integrations/meta-review-status \
  -H "Authorization: Bearer TU_TOKEN"
```

Respuesta esperada:
```json
{
  "success": true,
  "tests": [
    { "label": "public_profile", "executed": true, "executed_at": "2024-01-01T00:00:00Z" },
    { "label": "pages_show_list", "executed": true, "executed_at": "..." },
    { "label": "pages_utility_messaging", "executed": true, "executed_at": "..." },
    { "label": "instagram_manage_messages", "executed": true, "executed_at": "..." }
  ],
  "totalCompleted": 4,
  "totalRequired": 4
}
```

---

## 🎯 Próximo Paso: Enviar a Revisión

Una vez que los 4 tests estén completados:

1. Graba los videos requeridos (ver `REVISION_META_Y_GUION.md`)
2. Completa las respuestas en Meta App Review
3. Envía tu app para revisión
4. Espera 3-10 días hábiles

---

**Creado:** 21 de mayo, 2026
**Estado:** Backend actualizado con todos los endpoints necesarios
