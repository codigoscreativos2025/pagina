# Investigación: WhatsApp API sin Verificación de Negocio

## Resumen Ejecutivo

Este documento investiga las posibilidades de utilizar la API de WhatsApp Business de Meta sin necesidad de verificación de negocio ni carga de documentos legales. Basado en la experiencia del usuario con n8n y la documentación oficial de Meta.

---

## 1. Conclusión Principal

### ✅ Es posible usar WhatsApp API sin verificación de negocio

La Meta Cloud API permite comenzar a usar el servicio **sin verificación de negocio obligatoria**. Esto se conoce como "modo de prueba" o "test mode".

---

## 2. Modos de Uso de WhatsApp Cloud API

### 2.1 Modo de Prueba (Sin Verificación)

| Característica | Disponibilidad |
|----------------|-----------------|
| Recibir mensajes de clientes | ✅ Disponible |
| Responder mensajes | ✅ Disponible |
| 50 conversaciones gratuitas/mes | ✅ Disponible |
| Iniciar conversaciones | ❌ No disponible |
| Plantillas personalizadas | ⚠️ Requiere aprobación |
| Verificación azul (✓) | ❌ No disponible |

### 2.2 Requisitos para Modo de Prueba

| Requisito | Descripción |
|-----------|-------------|
| **Cuenta de Meta Developer** | Crear en developers.facebook.com |
| **Número de teléfono** | Puede ser personal o empresarial |
| **App de WhatsApp** | Crear en Meta Developer |
| **Token de acceso temporal** | Obtener del panel de Meta |

### 2.3 Escalamiento a Producción

Cuando el negocio necesita escalar:

| Requisito | Cuándo se Necesita |
|-----------|-------------------|
| Verificación de negocio | Para más de 50 conversaciones/mes |
| Business Manager verificado | Para iniciar conversaciones |
| Documentos legales | Para verificación completa y ✓ azul |

---

## 3. Proceso de Configuración (Sin Verificación)

### Paso 1: Crear Cuenta de Meta Developer

1. Ir a [developers.facebook.com](https://developers.facebook.com)
2. Iniciar sesión con cuenta Facebook personal
3. Crear una nueva aplicación
4. Seleccionar "Other" → "Business"
5. Agregar "WhatsApp" como producto

### Paso 2: Obtener Credenciales

Del panel de Meta Developer obtienes:

| Credencial | Descripción |
|------------|-------------|
| `PHONE_NUMBER_ID` | ID del número de teléfono |
| `WA_BUSINESS_ACCOUNT_ID` | ID de la cuenta de WhatsApp Business |
| `ACCESS_TOKEN` | Token temporal (expira en ~24 horas) |

### Paso 3: Configurar Webhook

```bash
# Endpoint del webhook (en tu servidor)
POST /webhook/whatsapp

# Verificación del webhook
GET /webhook?hub.verify_token=TU_VERIFY_TOKEN
```

### Paso 4: Configurar Número de Teléfono

1. Ir a "Phone Numbers" en el panel de Meta
2. Agregar número de teléfono
3. Verificar mediante código SMS
4. ¡Listo para usar!

---

## 4. Limitaciones del Modo Sin Verificación

### 4.1 Limitaciones de Mensajería

| Tipo de Mensaje | Sin Verificación | Con Verificación |
|-----------------|-------------------|-------------------|
| Respuestas a clientes | ✅ | ✅ |
| Mensajes entrantes | ✅ | ✅ |
| Mensajes salientes (iniciar) | ❌ | ✅ |
| Plantillas de mensaje | ⚠️ Limitado | ✅ |

### 4.2 Cuotas Gratuitas

| Cuota | Límite |
|-------|--------|
| Conversaciones gratuitas | 50/mes |
| Mensajes gratuitos | Ilimitados dentro de 50 conversaciones |
| Contactos | Ilimitados |

### 4.3 Después de 50 Conversaciones

| Opción | Costo |
|--------|-------|
| Continuar sin verificación | $0.01-0.03/mensaje |
| Verificar negocio (gratis) | Reducción de costos |

---

## 5. Comparación: Tu Configuración Actual (n8n)

### ✅ Confirma que Funciona

El usuario menciona que ya usa n8n con WhatsApp API sin verificación. Esto confirma:

1. **No se requieren documentos legales** - La configuración funciona
2. **El webhook se puede configurar** - Sin necesidad de verificación de negocio
3. **Los mensajes se pueden recibir y enviar** - Siempre que el cliente inicie

### 5.1 Tu Configuración Actual

```
┌─────────┐     n8n      ┌──────────────┐    ┌────────────────┐
│ Cliente │ ◄─────────► │  Workflow    │ ◄─►│ Meta Cloud API │
│ WhatsApp│             │  (Automatiz.)│    │  (Sin verificar)│
└─────────┘             └──────────────┘    └────────────────┘
```

---

## 6. Flujo Recomendado para Clientes de Paginapivot

### 6.1 Opción A: Nosotros proporcionamos el número

**Nosotros usamos nuestro número de WhatsApp Business:**

| Ventaja | Descripción |
|---------|-------------|
| Control total | Nosotros manejamos la API |
| Sin acción del cliente | Solo nos da información del negocio |
| Escalable | Un número puede servir a varios clientes (sesiones separadas) |

**Cómo funciona:**

```
Cliente 1 ──┐
            │         ┌─────────────┐
Cliente 2 ──┼────────►│  OpenClaw   │◄── Meta API (nuestro número)
            │         │  (Sesiones) │
Cliente 3 ──┘         └─────────────┘
```

### 6.2 Opción B: El cliente conecta su propio número

**El cliente usa su propio número de WhatsApp:**

| Ventaja | Descripción |
|---------|-------------|
| Número propio | El cliente tiene su número verificado |
| Más profesional | Los clientes ven el número del negocio |
| Mayor control | El cliente gestiona su WhatsApp |

**Cómo funciona:**

```
Cliente ──────► Meta Developer (autoriza)
                     │
                     ▼
              Configurar webhook
              (automático)
                     │
                     ▼
              OpenClaw conecta
              (sesión única)
```

---

## 7. Automatización de la Conexión del Cliente

### 7.1 Lo que Se Puede Automatizar

| Acción | Automatizable | Requiere Usuario |
|--------|---------------|------------------|
| Crear app en Meta | ❌ | El usuario debe crear |
| Agregar producto WhatsApp | ❌ | El usuario debe hacer |
| Obtener credentials | ✅ | Se puede extraer |
| Configurar webhook | ✅ | Automático |
| Registrar número | ✅ | Automático |
| Verificar teléfono (SMS) | ❌ | Usuario ingresa código |
| Aceptar T&C | ❌ | Usuario acepta |

### 7.2 Proceso Simplificado para el Cliente

```
┌──────────────────────────────────────────────────────┐
│           PROCESO DE CONEXIÓN DEL CLIENTE            │
├──────────────────────────────────────────────────────┤
│                                                       │
│  1. Cliente inicia en Paginapivot                    │
│     └─► Formulario basic (nombre, teléfono)          │
│                                                       │
│  2. Sistema genera enlace de Meta                    │
│     └─► https://developers.facebook.com/...          │
│                                                       │
│  3. Cliente crea app en Meta (manual)               │
│     └─► 5-10 minutos                                 │
│                                                       │
│  4. Cliente nos da credentials                      │
│     └─► PHONE_NUMBER_ID, ACCESS_TOKEN, etc.          │
│                                                       │
│  5. Paginapivot configura webhook                   │
│     └─► Automático via API                            │
│                                                       │
│  6. ¡Listo! Asistente activo                        │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### 7.3 Flujo con OAuth de Meta (Futuro)

Meta ofrece "Embedded Signup" para Solution Partners:

```
┌──────────────────────────────────────────────────────┐
│          EMBEDDED SIGNUP (PARA BSPs)                 │
├──────────────────────────────────────────────────────┤
│                                                       │
│  1. Cliente hace clic en "Conectar WhatsApp"        │
│                                                       │
│  2. Se abre ventana Meta (OAuth)                    │
│     └─► Usuario inicia sesión Facebook               │
│     └─► Acepta permisos                              │
│                                                       │
│  3. Meta verifica teléfono (SMS)                    │
│     └─► Cliente ingresa código                       │
│                                                       │
│  4. Sistema recibe credenciales                      │
│     └─► Automático                                   │
│                                                       │
│  5. ¡Listo!                                          │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**Nota**: El Embedded Signup requiere ser Solution Partner de Meta, lo cual tiene requisitos adicionales.

---

## 8. Implementación Técnica

### 8.1 Endpoint de Webhook

```javascript
// Ruta: /api/webhook/whatsapp
app.post('/api/webhook/whatsapp', async (req, res) => {
  // Verificar webhook
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }
  
  // Procesar mensaje
  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const message = changes?.value?.messages?.[0];
  
  if (message) {
    const from = message.from;
    const text = message.text?.body;
    
    // Identificar cliente por número
    const cliente = await buscarClientePorWhatsApp(from);
    
    if (cliente) {
      // Obtener configuración del cliente
      const config = await obtenerConfiguracion(cliente.id);
      
      // Enviar a OpenClaw
      const respuesta = await openclaw.procesarMensaje({
        session: cliente.session_id,
        message: text,
        context: config
      });
      
      // Enviar respuesta por WhatsApp
      await enviarMensajeWhatsApp(from, respuesta);
    }
  }
  
  res.sendStatus(200);
});
```

### 8.2 Envío de Mensajes

```javascript
async function enviarMensajeWhatsApp(to, message) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message }
      })
    }
  );
  
  return response.json();
}
```

---

## 9. Precios de WhatsApp API (Sin Verificación)

### 9.1 Costo por Conversación

| Tipo de Conversación | Costo (Aproximado) |
|----------------------|-------------------|
| Iniciada por cliente | $0.00 (gratis) |
| Iniciada por negocio (sin verificar) | ❌ No disponible |
| Iniciada por negocio (verificado) | $0.005 - $0.03 |

### 9.2 Después de las 50 Gratuitas

| Volumen | Costo por Conversación |
|---------|------------------------|
| 51-100K conversaciones | $0.0085 - $0.015 |
| 100K+ conversaciones | $0.005 - $0.01 |

---

## 10. Recomendaciones para Paginapivot

### 10.1 Estrategia Recomendada

**Fase Inicial (sin verificación):**

1. Usar un número de WhatsApp de Paginapivot para todos los clientes
2. Sesiones separadas en OpenClaw por cliente
3. Modalidad de prueba gratuita

**Fase de Escalamiento:**

1. Ofrecer opción de número propio del cliente
2. Ayudar al cliente a configurar su propia API
3. Charge extra por esta configuración

### 10.2 Beneficios de Nuestro Número

| Beneficio | Descripción |
|-----------|-------------|
| Simplicidad | El cliente no necesita cuenta de Meta |
| Control | Nosotros manejamos la API |
| Costo | Un número sirve para múltiples clientes |
| Mantenimiento | Nosotros actualizamos credenciales |

### 10.3 Beneficios del Número del Cliente

| Beneficio | Descripción |
|-----------|-------------|
| Profesionalismo | Los clientes ven el número del negocio |
| Mayor confianza | Número verificado con ✓ azul (futuro) |
| Control | El cliente tiene control de su WhatsApp |

---

## 11. Preguntas Frecuentes

### ¿Necesito documentos legales para comenzar?

**No**. Puedes comenzar sin documentos legales usando el modo de prueba.

### ¿Puedo responder mensajes sin verificación?

**Sí**. Puedes recibir y responder hasta 50 conversaciones gratis al mes.

### ¿Qué pasa cuando necesito escalar?

Cuando superes las 50 conversaciones, Meta te pedirá verificar el negocio. Es un proceso gratuito.

### ¿Puedo usar n8n sin verificación?

**Sí**. Tu configuración actual con n8n confirma que funciona.

### ¿El cliente puede usar su propio número?

**Sí**, pero requiere que el cliente cree una cuenta en Meta Developer. Nosotros podemos guiarle.

---

## 12. Referencias

| Recurso | URL |
|---------|-----|
| Meta WhatsApp Cloud API | https://developers.facebook.com/docs/whatsapp/cloud-api |
| Documentación Webhooks | https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks |
| Precios WhatsApp API | https://developers.facebook.com/docs/whatsapp/business-platform/pricing |
| 360Dialog (BSP) | https://docs.360dialog.com |

---

## 13. Conclusión Final

### Resumen: WhatsApp API sin Verificación

| Aspecto | Veredicto |
|---------|-----------|
| ¿Funciona sin documentos legales? | ✅ **Sí** |
| ¿Puedo recibir mensajes? | ✅ **Sí** |
| ¿Puedo responder mensajes? | ✅ **Sí** |
| ¿Hay límite gratuito? | ✅ **50 conversaciones/mes** |
| ¿Puedo iniciar conversaciones? | ❌ **No sin verificación** |
| ¿Necesito verificación para escalar? | ✅ **Eventually** |

### Recomendación

Para Paginapivot:

1. **Comenzar con nuestro número** - Más simple, sin acción del cliente
2. **Ofrecer número propio como upgrade** - Para clientes que lo prefieran
3. **Ayudar con verificación cuando escalen** - Proceso gratuito

---

*Documento creado: Abril 2026*
*Versión: 1.0*
*Investigación basada en documentación Meta y experiencia del usuario*
