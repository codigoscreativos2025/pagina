# 📘 LLAMADAS API PARA META APP REVIEW

## ✅ Permisos que necesitas verificar

Meta requiere que ejecutes estas 4 llamadas API para aprobar tu app:

| # | Permiso | API Call | Estado |
|---|---------|----------|--------|
| 1 | `pages_utility_messaging` | `POST /{page-id}/messages` con tag | ⚠️ Requiere lead con PSID |
| 2 | `public_profile` | `GET /me?fields=id,name,picture` | ✅ Listo para ejecutar |
| 3 | `pages_show_list` | `GET /me/accounts?fields=id,name` | ✅ Listo para ejecutar |
| 4 | `instagram_manage_messages` | `POST /me/messages` (Instagram) | ⚠️ Requiere lead con IG PSID |

---

## 🚀 OPCIONES PARA EJECUTAR

### OPCIÓN 1: Desde el Frontend (Más fácil)

1. Ve a `https://agents.pivotsoluciones.com/integrations`
2. Inicia sesión
3. Baja hasta **"📋 Meta App Review - Estado de Tests"**
4. Haz clic en **"Ejecutar"** en cada test pendiente

**Ventaja:** No necesitas herramientas externas, todo se hace desde la UI.

---

### OPCIÓN 2: Con cURL (Si tienes el token)

Primero obtén tu token de la API:

```bash
# Login para obtener token
curl -X POST https://agents.pivotsoluciones.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"tu-password"}'
```

Usa el token devuelto en las siguientes llamadas:

```bash
# 1. public_profile
curl -X POST https://agents.pivotsoluciones.com/api/integrations/test-public-profile \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# 2. pages_show_list
curl -X POST https://agents.pivotsoluciones.com/api/integrations/test-pages-show-list \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# 3. pages_utility_messaging
curl -X POST https://agents.pivotsoluciones.com/api/integrations/test-utility-message \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# 4. instagram_manage_messages
curl -X POST https://agents.pivotsoluciones.com/api/integrations/test-instagram/manage_messages \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

### OPCIÓN 3: Graph API Explorer (Manual)

Si las opciones automáticas fallan, usa [Graph API Explorer](https://developers.facebook.com/tools/explorer/):

#### Paso 1: Iniciar sesión en Graph API Explorer

1. Ve a https://developers.facebook.com/tools/explorer/
2. Selecciona tu app en el dropdown "Application"
3. Haz clic en "Get Token" → "Get User Access Token"
4. Selecciona los permisos:
   - ✅ `public_profile`
   - ✅ `pages_show_list`
   - ✅ `pages_messaging`
   - ✅ `instagram_manage_messages`

#### Paso 2: Ejecutar cada llamada

**1. public_profile**
```
GET /me?fields=id,name,picture.width(100)
```

**Resultado esperado:**
```json
{
  "id": "123456789",
  "name": "Tu Nombre",
  "picture": { ... }
}
```

---

**2. pages_show_list**
```
GET /me/accounts?fields=id,name,access_token
```

**Resultado esperado:**
```json
{
  "data": [
    {
      "id": "987654321",
      "name": "Tu Página",
      "access_token": "EAAG..."
    }
  ]
}
```

---

**3. pages_utility_messaging**

Primero necesitas un PSID (Facebook User ID). Si ya tienes leads en tu CRM, usa ese PSID. Si no:

a) Envía un mensaje a tu página desde otra cuenta de Facebook
b) O usa este endpoint para obtener el PSID de alguien que ya te haya escrito:

```
GET /{page-id}/conversations?fields=participants&access_token={page-access-token}
```

Una vez tengas el PSID:

```
POST /{page-id}/messages
```

Body (JSON):
```json
{
  "recipient": {
    "id": "PSID_DEL_USUARIO"
  },
  "message": {
    "text": "✅ This is a test confirmation message for Meta App Review. Your appointment has been confirmed."
  },
  "messaging_type": "MESSAGE_TAG",
  "tag": "CONFIRMATION_UPDATE"
}
```

**Resultado esperado:**
```json
{
  "recipient_id": "123456789",
  "message_id": "t1_123456789"
}
```

---

**4. instagram_manage_messages**

Necesitas un Instagram User ID (diferente al PSID de Facebook). Si tienes leads en tu CRM con `instagram_psid`, úsalo.

```
POST /me/messages
```

Body (JSON):
```json
{
  "recipient": {
    "id": "INSTAGRAM_USER_ID"
  },
  "message": {
    "text": "✅ Test message for Meta App Review - instagram_manage_messages"
  }
}
```

**Resultado esperado:**
```json
{
  "message_id": "t1_987654321"
}
```

---

## 🔍 Verificar que Meta registró las llamadas

Después de ejecutar cada llamada:

1. Ve a https://developers.facebook.com/
2. Tu App → **App Review** → **Permissions**
3. Busca el permiso que acabas de testear
4. Debería decir **"Used"** o mostrar un timestamp reciente

---

## ⚠️ PROBLEMAS COMUNES

### "No Facebook leads found" / "No PSID available"

**Problema:** No hay nadie que te haya enviado mensaje.

**Solución:**
1. Pide a un amigo que envíe un mensaje a tu página de Facebook
2. O usa Graph API Explorer para obtener el PSID de alguien que ya te escribió:
   ```
   GET /{page-id}/conversations?fields=participants&access_token={page-access-token}
   ```

### "No Instagram users found"

**Problema:** No hay DMs de Instagram.

**Solución:**
1. Pide a alguien que envíe un DM a tu Instagram
2. Asegúrate de que tu Instagram sea cuenta **Business**

### "Invalid access token"

**Problema:** El token expiró o no tiene los permisos necesarios.

**Solución:**
1. Genera un nuevo token en Graph API Explorer
2. Asegúrate de seleccionar TODOS los permisos necesarios
3. Para producción, usa un token de larga duración

---

## 📋 Checklist Final

Antes de enviar a revisión:

- [ ] ✅ `public_profile` - Ejecutado y registrado
- [ ] ✅ `pages_show_list` - Ejecutado y registrado
- [ ] ✅ `pages_utility_messaging` - Ejecutado y registrado
- [ ] ✅ `instagram_manage_messages` - Ejecutado y registrado
- [ ] ✅ Todos los tests muestran "Used" en Meta Developers
- [ ] ✅ Tienes videos grabados para cada permiso (si es requerido)

---

## 🎯 Después de Ejecutar

1. Ve a **Integraciones** en tu plataforma
2. Verifica que todos los tests digan **"✅ Ejecutado"**
3. Toma capturas de pantalla
4. Graba los videos requeridos (30-90 seg c/u)
5. Envía tu app para revisión en Meta

---

**Documentación creada:** 21 de mayo, 2026
**Permisos cubiertos:** 4 de 4 requeridos
