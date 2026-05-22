# Ejecutar Tests de Meta App Review

## Método 1: Desde el Backend (Recomendado)

El backend ya tiene implementados los endpoints para ejecutar los tests. Puedes llamarlos desde el frontend o con curl:

```bash
# 1. public_profile
curl -X POST https://agents.pivotsoluciones.com/api/integrations/test-public-profile \
  -H "Authorization: Bearer TU_TOKEN_DE_USUARIO"

# 2. pages_show_list
curl -X POST https://agents.pivotsoluciones.com/api/integrations/test-pages-show-list \
  -H "Authorization: Bearer TU_TOKEN_DE_USUARIO"

# 3. pages_utility_messaging
curl -X POST https://agents.pivotsoluciones.com/api/integrations/test-utility-message \
  -H "Authorization: Bearer TU_TOKEN_DE_USUARIO"

# 4. instagram_manage_messages
curl -X POST https://agents.pivotsoluciones.com/api/integrations/test-instagram/manage_messages \
  -H "Authorization: Bearer TU_TOKEN_DE_USUARIO"
```

## Método 2: Desde el Frontend

1. Ve a `https://agents.pivotsoluciones.com/integrations`
2. Baja hasta la sección "📋 Meta App Review - Estado de Tests"
3. Haz clic en **"Ejecutar"** en cada test pendiente

## Método 3: Script Directo

Si tienes acceso a la base de datos y las credenciales:

```bash
cd backend
node ../scripts/execute-meta-review-tests.js
```

**Requisitos:**
- `DATABASE_URL` debe estar configurada
- Al menos 1 usuario con Facebook conectado
- Al menos 1 lead con `facebook_psid` para el test de utility_message
- Al menos 1 lead con `instagram_psid` para el test de instagram_manage_messages

## Método 4: Graph API Explorer (Manual)

Si los métodos automáticos fallan, usa [Graph API Explorer](https://developers.facebook.com/tools/explorer/):

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
  "message": { "text": "Test confirmation message for Meta App Review" },
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

## Verificar Estado

```bash
curl https://agents.pivotsoluciones.com/api/integrations/meta-review-status \
  -H "Authorization: Bearer TU_TOKEN_DE_USUARIO"
```

O desde el frontend en `/integrations`.
