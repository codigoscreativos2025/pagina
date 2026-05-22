# ✅ IMPLEMENTACIÓN COMPLETA - META APP REVIEW API CALLS

## 📦 Resumen de Cambios

### Backend - Archivos Modificados

#### 1. `backend/src/routes/facebook.js`
**Cambios:**
- ✅ Mejorado logging en webhook GET (agregado `req.query` completo)
- ✅ Mejorado logging en webhook POST (más detalles, mejor formato)
- ✅ Agregado logging detallado en `handleFacebookMessages()`

**Propósito:** Diagnosticar por qué los mensajes de Facebook no llegan al backend.

---

#### 2. `backend/src/routes/integrations.js`
**Endpoints Nuevos:**
- ✅ `POST /api/integrations/test-public-profile` - Test para `public_profile`
- ✅ `POST /api/integrations/test-pages-show-list` - Test para `pages_show_list`
- ✅ Actualizado `GET /api/integrations/meta-review-status` para incluir los nuevos tests

**Propósito:** Permitir ejecutar las llamadas API requeridas por Meta.

---

#### 3. `backend/src/index.js`
**Cambios:**
- ✅ Nueva función `executeFacebookTest()` para tests de Facebook
- ✅ Actualizada `executeMetaReviewTest()` para incluir `public_profile` y `pages_show_list`
- ✅ Tests se ejecutan automáticamente al iniciar el backend

**Tests automáticos al iniciar:**
1. `public_profile`
2. `pages_show_list`
3. `pages_utility_messaging`
4. `instagram_manage_messages`
5. `instagram_manage_comments`
6. `instagram_manage_insights`
7. `instagram_content_publish`

---

### Frontend - Archivos Modificados

#### 4. `frontend/src/pages/Integrations.jsx`
**Cambios:**
- ✅ Agregados botones para ejecutar `public_profile` y `pages_show_list`
- ✅ Actualizada función `runMetaTest()` para manejar los nuevos tests
- ✅ Panel de Meta Review muestra ahora 7 tests (4 Facebook + 3 Instagram)

---

### Scripts - Archivos Creados

#### 5. `scripts/execute-meta-review-tests.js`
**Propósito:** Script standalone para ejecutar todos los tests desde la línea de comandos.

**Uso:**
```bash
cd backend
node ../scripts/execute-meta-review-tests.js
```

**Requisitos:**
- `DATABASE_URL` configurada
- Al menos 1 usuario con Facebook conectado
- Al menos 1 lead con `facebook_psid`
- Al menos 1 lead con `instagram_psid`

---

#### 6. `scripts/README.md`
**Contenido:** Instrucciones para usar el script y alternativas.

---

### Documentación - Archivos Creados

#### 7. `LLAMADAS_API_META.md`
**Contenido:**
- Explicación detallada de las 4 llamadas requeridas
- 3 métodos para ejecutar (Frontend, cURL, Graph API Explorer)
- Solución de problemas comunes
- Checklist final

---

#### 8. `INSTRUCCIONES_EJECUCION_META.md`
**Contenido:**
- Instrucciones paso a paso simplificadas
- Comandos cURL listos para copiar/pegar
- Verificación de resultados

---

## 🎯 Permisos que Meta Requiere Verificar

| # | Permiso | API Call | Endpoint Backend | Estado |
|---|---------|----------|------------------|--------|
| 1 | `pages_utility_messaging` | `POST /{page-id}/messages` con tag | `POST /test-utility-message` | ✅ Implementado |
| 2 | `public_profile` | `GET /me?fields=id,name,picture` | `POST /test-public-profile` | ✅ Implementado |
| 3 | `pages_show_list` | `GET /me/accounts?fields=id,name` | `POST /test-pages-show-list` | ✅ Implementado |
| 4 | `instagram_manage_messages` | `POST /me/messages` (IG DM) | `POST /test-instagram/manage_messages` | ✅ Implementado |

---

## 🚀 Cómo Ejecutar las Llamadas

### Método 1: Frontend (Recomendado)

1. Ve a `https://agents.pivotsoluciones.com/integrations`
2. Inicia sesión
3. Busca **"📋 Meta App Review - Estado de Tests"**
4. Haz clic en **"Ejecutar"** en cada test pendiente

### Método 2: cURL

```bash
# Obtener token primero
curl -X POST https://agents.pivotsoluciones.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"tu-password"}'

# Ejecutar tests
curl -X POST https://agents.pivotsoluciones.com/api/integrations/test-public-profile \
  -H "Authorization: Bearer TU_TOKEN"

curl -X POST https://agents.pivotsoluciones.com/api/integrations/test-pages-show-list \
  -H "Authorization: Bearer TU_TOKEN"

curl -X POST https://agents.pivotsoluciones.com/api/integrations/test-utility-message \
  -H "Authorization: Bearer TU_TOKEN"

curl -X POST https://agents.pivotsoluciones.com/api/integrations/test-instagram/manage_messages \
  -H "Authorization: Bearer TU_TOKEN"
```

### Método 3: Script

```bash
cd backend
node ../scripts/execute-meta-review-tests.js
```

---

## 🔍 Verificar Resultados

### Desde el Frontend
1. Ve a `/integrations`
2. Revisa la sección de Meta App Review
3. Todos los tests deberían decir **"✅ Ejecutado"**

### Desde la API
```bash
curl https://agents.pivotsoluciones.com/api/integrations/meta-review-status \
  -H "Authorization: Bearer TU_TOKEN"
```

### Desde la Base de Datos
```sql
SELECT test_name, executed_at, result FROM meta_review_tests ORDER BY executed_at DESC;
```

---

## ⚠️ Solución de Problemas

### Webhook no recibe mensajes de Facebook

**Síntoma:** Los mensajes no llegan al CRM.

**Diagnóstico:**
1. Revisa logs del backend después de enviar un mensaje
2. Busca: `[Facebook Webhook] Received`
3. Si no aparece, el webhook no está llegando

**Solución:**
1. Ve a [Meta Developers](https://developers.facebook.com/)
2. Tu App → **Webhooks**
3. Verifica:
   - Callback URL: `https://agents.pivotsoluciones.com/api/integrations/facebook/webhook`
   - Verify Token: `pivot_verify_token_2024`
   - Subscribed fields: `messages`, `messaging_postbacks`, `messaging_optins`
4. Haz clic en **Edit** y re-suscríbete a los campos

**Comando útil:**
```bash
# Desde el frontend, usa el botón 🔍 Diagnosticar en Facebook Messenger
# O llama al endpoint:
curl https://agents.pivotsoluciones.com/api/integrations/facebook/webhook-status \
  -H "Authorization: Bearer TU_TOKEN"
```

### "No Facebook leads found"

**Causa:** No hay PSIDs en la base de datos.

**Solución:**
1. Pide a alguien que envíe un mensaje a tu página
2. O usa Graph API Explorer para obtener un PSID existente

### "No Instagram users found"

**Causa:** No hay Instagram PSIDs en la base de datos.

**Solución:**
1. Pide a alguien que envíe un DM a tu Instagram
2. Asegúrate de que sea cuenta Business

---

## 📋 Checklist Final

Antes de enviar a revisión en Meta:

- [ ] ✅ Backend reiniciado con los nuevos endpoints
- [ ] ✅ `public_profile` ejecutado y registrado
- [ ] ✅ `pages_show_list` ejecutado y registrado
- [ ] ✅ `pages_utility_messaging` ejecutado y registrado
- [ ] ✅ `instagram_manage_messages` ejecutado y registrado
- [ ] ✅ Webhook de Facebook funcionando (los mensajes llegan al CRM)
- [ ] ✅ Videos grabados para cada permiso (ver `REVISION_META_Y_GUION.md`)
- [ ] ✅ Respuestas actualizadas en Meta App Review

---

## 🎯 Próximos Pasos

1. **Reiniciar el backend** en EasyPanel
2. **Ejecutar los 4 tests** desde el frontend
3. **Verificar** que todos muestren "✅ Ejecutado"
4. **Grabar los videos** requeridos
5. **Enviar a revisión** en Meta Developers

---

## 📞 Comandos Útiles

### Ver logs del webhook en tiempo real
```bash
# En EasyPanel: Usa la consola del contenedor
# O SSH: journalctl -u pivot-backend -f | grep -i webhook
```

### Ver tests en la BD
```sql
SELECT test_name, executed_at, result FROM meta_review_tests ORDER BY executed_at DESC;
```

### Limpiar tests (para re-ejecutar)
```sql
DELETE FROM meta_review_tests;
```

### Ver leads con PSID
```sql
SELECT id, name, facebook_psid, instagram_psid, source, created_at 
FROM leads 
WHERE facebook_psid IS NOT NULL OR instagram_psid IS NOT NULL;
```

---

## 📄 Archivos de Referencia

| Archivo | Propósito |
|---------|-----------|
| `INSTRUCCIONES_EJECUCION_META.md` | Instrucciones simplificadas |
| `LLAMADAS_API_META.md` | Guía detallada de APIs |
| `REVISION_META_Y_GUION.md` | Guiones para videos de Meta |
| `SOLUCION_WEBHOOK_Y_META_REVIEW.md` | Troubleshooting webhook |
| `RESUMEN_IMPLEMENTACION.md` | Resumen de implementación anterior |

---

**Implementación completada:** 21 de mayo, 2026  
**Archivos modificados:** 3 backend + 1 frontend + 2 scripts + 4 documentación  
**Endpoints nuevos:** 2 (public_profile, pages_show_list)  
**Tests automáticos:** 7 total (4 Facebook + 3 Instagram)

---

## ✅ LISTO PARA EJECUTAR

Sigue las instrucciones en `INSTRUCCIONES_EJECUCION_META.md` para ejecutar las 4 llamadas API requeridas por Meta.
