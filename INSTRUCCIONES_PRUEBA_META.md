# Instrucciones de Prueba para Meta App Review - pages_messaging

## ⚠️ IMPORTANTE: Cuenta de Prueba

**NO usar un "Test User" creado en App Roles.** Meta requiere una cuenta REAL de Facebook con rol de **Evaluator** en la aplicación.

### Configuración requerida antes de enviar:

1. **Crear una Página de Facebook de prueba:**
   - Ve a facebook.com/pages/create
   - Crea una página llamada "Pivot Test Page" (o similar)
   - Esta será la página que conectes a tu app

2. **Agregar la cuenta de prueba como Evaluator:**
   - Ve a developers.facebook.com → Tu App → App Roles → Evaluator
   - Agrega la cuenta de Facebook de prueba (debe ser una cuenta real, no test user)
   - La cuenta debe aceptar la invitación

3. **Conectar la Página a tu app:**
   - Inicia sesión como la cuenta de prueba en `agents.pivotsoluciones.com`
   - Ve a `/integrations`
   - Conecta la Página de prueba usando "Conectar con Facebook"
   - Asegúrate de que la tarjeta muestre "✅ Conectado"

4. **Configurar webhooks:**
   - Verifica que el webhook esté configurado en Meta Developers
   - URL: `https://agents.pivotsoluciones.com/api/integrations/facebook/webhook`
   - Verify Token: `pivot_verify_token_2024` (o el que uses)
   - Campos suscritos: `messages`, `messaging_postbacks`

---

## 📋 Instrucciones Paso a Paso para Meta Review

### Paso 1: Iniciar sesión con la cuenta de prueba

**URL:** `https://agents.pivotsoluciones.com/login`

1. Abre el navegador en modo incógnito
2. Ve a `https://agents.pivotsoluciones.com/login`
3. Haz clic en **"Continue with Facebook"**
4. Inicia sesión con la cuenta de prueba que tiene rol de Evaluator
5. Deberías ser redirigido al Dashboard

---

### Paso 2: Verificar la integración de Facebook

**URL:** `https://agents.pivotsoluciones.com/integrations`

1. En el Dashboard, haz clic en **"Integraciones"** en el menú lateral
2. Busca la tarjeta de **Facebook Messenger**
3. Debería mostrar "✅ Conectado" con el nombre de tu Página de prueba
4. Si no está conectada, haz clic en "Conectar con Facebook" y sigue el flujo

---

### Paso 3: Enviar un mensaje de prueba a la Página

**Desde una cuenta PERSONAL de Facebook (diferente a la de prueba):**

1. Abre otra ventana del navegador o usa tu computadora/celular personal
2. Ve a tu Página de prueba en Facebook: `facebook.com/NombreDeTuPagina`
3. Haz clic en el botón **"Enviar mensaje"**
4. Escribe un mensaje de prueba, por ejemplo:
   ```
   Hola, quiero información sobre sus servicios
   ```
5. Envía el mensaje

---

### Paso 4: Verificar que el mensaje llegó al CRM

**URL:** `https://agents.pivotsoluciones.com/crm`

1. Regresa a la ventana donde iniciaste sesión con la cuenta de prueba
2. En el Dashboard, haz clic en **"CRM / Chats"** en el menú lateral
3. Deberías ver una nueva conversación en la lista izquierda con:
   - Ícono 💬 (Facebook Messenger)
   - El nombre de la persona que envió el mensaje
   - El mensaje que escribió
4. Haz clic en la conversación para abrirla

---

### Paso 5: Verificar la respuesta automática del agente de IA

1. Dentro de la conversación, deberías ver:
   - El mensaje del cliente (marcado como "client")
   - Una respuesta automática generada por la IA (marcada como "agent")
2. La respuesta debería ser contextual al mensaje enviado
3. Ejemplo de respuesta esperada:
   ```
   ¡Hola! Gracias por contactarnos. Con gusto te brindamos información sobre nuestros servicios. 
   ¿Qué tipo de servicio te interesa conocer?
   ```

---

### Paso 6: Verificar que la respuesta llegó a Facebook Messenger

1. Regresa a la ventana donde enviaste el mensaje desde tu cuenta personal
2. Deberías ver la respuesta del bot en Messenger
3. La respuesta debe coincidir con la que aparece en el CRM

---

### Paso 7: Probar el envío manual de mensajes (opcional)

1. En el CRM (`agents.pivotsoluciones.com/crm`), dentro de la conversación:
2. Escribe un mensaje manual en el campo de texto inferior
3. Haz clic en "Enviar" o presiona Enter
4. El mensaje debería aparecer en Messenger en tu cuenta personal

---

## 🔍 Checklist para el Revisor de Meta

El revisor debe poder verificar:

- [ ] La cuenta de prueba puede iniciar sesión con Facebook
- [ ] La Página de prueba está conectada en Integraciones
- [ ] Los mensajes enviados a la Página llegan al CRM
- [ ] El agente de IA responde automáticamente
- [ ] Las respuestas del bot llegan a Facebook Messenger
- [ ] El usuario puede enviar mensajes manuales desde el CRM

---

## 🎥 Capturas de pantalla recomendadas

Adjunta estas capturas junto con las instrucciones:

1. **Screenshot 1:** Página de login con el botón "Continue with Facebook"
2. **Screenshot 2:** Dashboard de Integraciones mostrando "✅ Conectado"
3. **Screenshot 3:** CRM mostrando la bandeja de entrada con conversaciones de Facebook
4. **Screenshot 4:** Conversación abierta mostrando mensaje entrante y respuesta de la IA
5. **Screenshot 5:** Facebook Messenger mostrando la respuesta del bot

---

## 📝 Texto para copiar y pegar en Meta App Review

```
INSTRUCCIONES PARA PROBAR pages_messaging:

1. INICIAR SESIÓN:
   - Ve a https://agents.pivotsoluciones.com/login
   - Haz clic en "Continue with Facebook"
   - Inicia sesión con la cuenta de prueba (Evaluator)

2. VERIFICAR INTEGRACIÓN:
   - Ve a https://agents.pivotsoluciones.com/integrations
   - Confirma que Facebook Messenger muestra "✅ Conectado"

3. ENVIAR MENSAJE DE PRUEBA:
   - Desde una cuenta PERSONAL de Facebook (no la de prueba)
   - Ve a la Página de prueba: facebook.com/[NombreDeTuPagina]
   - Haz clic en "Enviar mensaje"
   - Escribe: "Hola, quiero información sobre sus servicios"
   - Envía el mensaje

4. VERIFICAR RECEPCIÓN EN CRM:
   - Regresa a https://agents.pivotsoluciones.com/crm
   - Haz clic en "CRM / Chats"
   - Deberías ver la nueva conversación con ícono 💬
   - Haz clic para abrir la conversación

5. VERIFICAR RESPUESTA AUTOMÁTICA:
   - Dentro de la conversación, verás el mensaje del cliente
   - Debajo, verás la respuesta automática de la IA
   - La respuesta es contextual al mensaje recibido

6. VERIFICAR ENVÍO A MESSENGER:
   - Regresa a Facebook Messenger (cuenta personal)
   - Deberías ver la respuesta del bot en el chat

FUNCIONALIDADES CLAVE:
- Los mensajes de Facebook llegan al CRM en tiempo real vía webhooks
- El agente de IA procesa y responde automáticamente
- Los usuarios pueden responder manualmente desde el CRM
- Todo el historial se guarda en la base de datos

CUENTA DE PRUEBA:
- La cuenta proporcionada tiene rol de Evaluator en la app
- La cuenta es REAL (no es un Test User de App Roles)
- La cuenta administra la Página de prueba conectada
```

---

## 🚨 Errores comunes a evitar

1. ❌ **Usar Test User de App Roles** → Meta lo rechazará
2. ❌ **Webhook no configurado** → Los mensajes no llegarán al CRM
3. ❌ **Página no conectada** → No habrá integración que probar
4. ❌ **App en modo Development** → Solo admins pueden probar
5. ❌ **Permisos no aprobados** → pages_messaging debe estar en Standard Access o Advanced Access

---

## ✅ Verificación final antes de enviar

- [ ] La cuenta de prueba es REAL (no Test User)
- [ ] La cuenta tiene rol de **Evaluator** en App Roles
- [ ] La cuenta aceptó la invitación de Evaluator
- [ ] La Página de prueba está conectada en Integraciones
- [ ] El webhook está configurado y verificado
- [ ] La app está en modo **Live** (no Development)
- [ ] Probaste el flujo completo al menos una vez
- [ ] Las capturas de pantalla muestran el flujo completo
