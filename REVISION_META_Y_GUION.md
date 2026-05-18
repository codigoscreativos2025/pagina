# Revisión de Respuestas para Meta App Review + Guion de Video

## ⚠️ PROBLEMAS CRÍTICOS ENCONTRADOS

### 1. `handleFacebookMessages` NO EXISTÍA
La función era llamada en el webhook pero nunca estaba definida. **FIXED** - ya se agregó la función en el commit más reciente.

### 2. Los permisos dicen más de lo que la app hace
| Permiso | Lo que dice la respuesta | Lo que la app REALMENTE hace | Riesgo |
|---------|--------------------------|------------------------------|--------|
| `ads_management` | "pausar/activar campañas" | Solo LEE métricas. No hay UI para pausar/activar | 🔴 ALTO - Meta podría rechazar |
| `pages_read_engagement` | "leer comentarios y menciones" | Solo recibe DMs de Messenger. NO maneja comentarios ni menciones | 🟡 MEDIO |
| `analytics/meta-ads` | Datos reales de campañas | Datos HARDCODEADOS (reach: 22450, impressions: 45000...) | 🟡 MEDIO |

### 3. Permisos que SÍ funcionan correctamente
- ✅ `pages_show_list` - Funciona, muestra lista de páginas
- ✅ `instagram_business_basic` - Funciona, lee info de la cuenta
- ✅ `instagram_business_manage_messages` - Funciona, recibe y envía DMs
- ✅ `whatsapp_business_messaging` - Funciona, recibe y envía mensajes
- ✅ `whatsapp_business_management` - Funciona, gestión completa de templates
- ✅ `business_management` - Funciona, lee estructura del Business Manager

---

## CORRECCIONES SUGERIDAS A LAS RESPUESTAS

### `ads_management` - CORREGIR
**Respuesta actual:** Dice que los usuarios pueden "pausar, activar o ajustar el presupuesto de sus campañas"
**Respuesta correcta:** "Nuestra aplicación utiliza `ads_management` para mostrar a los usuarios información consolidada de sus campañas publicitarias (estado, presupuesto, métricas) en un dashboard unificado con su CRM. Esto permite a los dueños de negocios ver qué campañas están generando leads y tomar decisiones informadas. Actualmente la funcionalidad es de solo lectura; los usuarios pueden ver el estado de sus campañas pero no modificarlas desde nuestra plataforma."

### `pages_read_engagement` - CORREGIR
**Respuesta actual:** "leer los mensajes, comentarios y menciones"
**Respuesta correcta:** "Usamos `pages_read_engagement` para recibir mensajes directos (DMs) enviados a la Página de Facebook del usuario. Estos mensajes se enrutan a nuestro CRM donde los agentes de IA procesan las consultas y responden automáticamente. No leemos ni procesamos comentarios públicos ni menciones en publicaciones."

---

## 🎬 GUION DE VIDEO POR CASO DE USO

> **Reglas generales:**
> - Graba con OBS Studio o Loom (screencast REAL)
> - La barra de URL del navegador DEBE ser visible: `https://agents.pivotsoluciones.com`
> - Duración: 30-90 segundos por video
> - Narrar en inglés si es posible
> - Mostrar SIEMPRE el flujo completo:-login → acción → resultado

---

### 🎬 Video 1: `pages_show_list` (30 seg)

**Qué grabar:**
1. Abrir navegador en `https://agents.pivotsoluciones.com/integrations`
2. Hacer clic en **"Conectar con Facebook"** en la tarjeta de Facebook o Instagram
3. Se abre la ventana emergente de Facebook Login
4. **ZOOM IN** en la lista de Páginas que aparece en la ventana de permisos
5. Seleccionar una Página
6. Cerrar la ventana y mostrar que la tarjeta cambia a "✅ Conectado"

**Narración:** "When a user clicks Connect, we use pages_show_list to display their Facebook Pages so they can select which Page to link with our CRM. This permission is only used during the initial setup process."

---

### 🎬 Video 2: `business_management` (45 seg)

**Qué grabar:**
1. Ir a `https://agents.pivotsoluciones.com/integrations`
2. Clic en **"Conectar con Facebook"** en la tarjeta de Meta Ads
3. Mostrar la ventana de permisos que pide acceso al Business Manager
4. Aceptar los permisos
5. Mostrar la tarjeta de Meta Ads que cambia a "✅ Conectado" con el nombre de la cuenta
6. Navegar a `/meta-ads`
7. Mostrar que se cargan las campañas con sus métricas

**Narración:** "We use business_management to read the user's Business Manager structure so they can select which ad account to connect. This allows us to display their campaign metrics alongside their CRM data."

---

### 🎬 Video 3: `ads_read` (30 seg)

**Qué grabar:**
1. Ir a `https://agents.pivotsoluciones.com/meta-ads` (con Meta Ads ya conectado)
2. Mostrar la tabla de campañas con estado, presupuesto, métricas
3. Hacer scroll si hay más datos
4. Resaltar que los datos son de SOLO LECTURA (no hay botones de editar)

**Narración:** "Our platform uses ads_read to fetch read-only campaign performance metrics — spend, impressions, clicks — and display them in a consolidated dashboard so business owners can monitor their ROI alongside their AI agent activity."

---

### 🎬 Video 4: `pages_read_engagement` (45 seg)

**Qué grabar:**
1. Ir a `https://agents.pivotsoluciones.com/crm`
2. Mostrar la lista de conversaciones en el sidebar izquierdo
3. Hacer clic en una conversación que tenga el ícono 💬 (Facebook)
4. Mostrar los mensajes entrantes del cliente
5. Mostrar cómo el agente de IA respondió automáticamente
6. Si es posible, desde otra ventana enviar un mensaje de Messenger y verlo aparecer en tiempo real

**Narración:** "We use pages_read_engagement to receive direct messages sent to the user's Facebook Page. These messages are routed to our CRM inbox where AI agents automatically process and respond to customer inquiries."

---

### 🎬 Video 5: `ads_management` - ⚠️ NO GRABAR ACCIONES DE ESCRITURA

**Qué grabar:** (Solo lectura - NO mostrar pausar/activar campañas)
1. Ir a `https://agents.pivotsoluciones.com/meta-ads`
2. Mostrar la lista de campañas con su estado (ACTIVE/PAUSED)
3. Mostrar que los datos se cargan correctamente
4. **NO** mostrar ninguna acción de edición

**Narración:** "We use ads_management to display campaign status and performance metrics to our users. Currently our integration is read-only — users can view their campaign data but all campaign management is done through Meta's own tools. This permission allows us to provide a unified view of ad performance within the CRM."

---

### 🎬 Video 6: `instagram_business_basic` (30 seg)

**Qué grabar:**
1. Ir a `https://agents.pivotsoluciones.com/integrations`
2. Mostrar la tarjeta de Instagram (desconectada)
3. Clic en **"Conectar con Facebook"**
4. Mostrar la ventana de permisos de Facebook pidiendo acceso a Instagram
5. Aceptar y mostrar la tarjeta cambiando a "✅ Conectado" con el nombre de la cuenta
6. Mostrar en el CRM que aparece el ícono 📸 junto a las conversaciones

**Narración:** "We use instagram_business_basic to read the user's professional Instagram account info — name and profile identifier — so we can correctly display it inside our CRM and link messages to the right account."

---

### 🎬 Video 7: `instagram_business_manage_messages` (60 seg) ⭐ MÁS IMPORTANTE

**Qué grabar:**
1. Abrir Instagram en el celular o en otra pestaña
2. Enviar un DM a la cuenta de Instagram del negocio
3. Cambiar a `https://agents.pivotsoluciones.com/crm`
4. Mostrar que el mensaje aparece en la lista de conversaciones con ícono 📸
5. Hacer clic en la conversación
6. Mostrar el mensaje entrante del cliente
7. Mostrar la respuesta automática del agente de IA
8. Volver a Instagram y mostrar que la respuesta llegó al DM

**Narración:** "This is the core of our Instagram integration. We use instagram_business_manage_messages to receive DMs via webhooks, display them in our omnichannel CRM, and our AI agents automatically respond to customer inquiries. Let me show you — I'll send a message from this Instagram account, and you can see it appear in real-time in our CRM, where the AI processes it and sends back a response."

---

### 🎬 Video 8: `whatsapp_business_messaging` (60 seg) ⭐ TAMBIÉN IMPORTANTE

**Qué grabar:**
1. Desde un teléfono, enviar un mensaje de WhatsApp al número de Business
2. Ir a `https://agents.pivotsoluciones.com/crm`
3. Mostrar que el mensaje aparece con el ícono 📱
4. Hacer clic en la conversación
5. Mostrar el mensaje entrante
6. Mostrar la respuesta automática del agente de IA
7. Volver al teléfono y mostrar que la respuesta llegó

**Narración:** "We use whatsapp_business_messaging to send and receive WhatsApp messages on behalf of our users' businesses. When a customer writes to their WhatsApp Business number, our AI agent processes the message and generates a contextual response that is sent back through the WhatsApp Cloud API."

---

### 🎬 Video 9: `whatsapp_business_management` (45 seg)

**Qué grabar:**
1. Ir a `https://agents.pivotsoluciones.com/templates`
2. Mostrar la lista de plantillas de WhatsApp (o crear una nueva)
3. Hacer clic en "Nueva Plantilla"
4. Llenar el formulario: nombre, categoría, cuerpo del mensaje con variables {{1}}, {{2}}
5. Hacer clic en "Enviar a Meta" (submit para aprobación)
6. Mostrar el estado "PENDING" de la plantilla
7. Si hay una plantilla aprobada, mostrar cómo se puede usar desde el CRM

**Narración:** "whatsapp_business_management allows our users to create and manage WhatsApp message templates directly from our platform. Users can draft templates with dynamic variables, submit them to Meta for approval, and once approved, use them to send outbound messages to their customers."

---

### 🎬 Video 10: `public_profile` (No requiere video)

Solo confirmar el uso permitido. Si Meta pide video:

1. Ir a `https://agents.pivotsoluciones.com/login`
2. Clic en "Continue with Facebook"
3. Mostrar la ventana de permisos (solo pide nombre y foto)
4. Mostrar que después del login aparece el nombre del usuario en el dashboard

**Narración:** "We use public_profile exclusively for Facebook Login. This allows users to quickly create an account using their Facebook credentials. We only access their name and profile picture."

---

### 🎬 Video 11: `Marketing API Access Tier` (No requiere video)

Solo verificar que las llamadas de prueba se hayan hecho:
1. Ir a `https://agents.pivotsoluciones.com/meta-ads`
2. Confirmar que las métricas de campañas se cargan correctamente
3. Tomar captura de pantalla si Meta lo pide

---

## ✅ Texto de Confirmación de Uso Permitido (para TODOS los permisos)

> "We confirm that our application, Pivot.AI (agents.pivotsoluciones.com), will strictly adhere to Meta's Platform Policies and the specific usage guidelines for this permission. We will only access the minimum data necessary to provide our CRM and AI automation services. We do not sell, share, or transfer user data to third parties. All access tokens are encrypted and stored securely in our PostgreSQL database. Users can revoke access at any time from their Integrations settings page at agents.pivotsoluciones.com/integrations."

---

## 📝 Descripción de la Empresa

**En español:**
> "Somos una plataforma SaaS de CRM con Inteligencia Artificial que ayuda a las empresas a automatizar la atención al cliente por WhatsApp, Instagram y Facebook, y a monitorear el rendimiento de sus campañas publicitarias en un solo lugar."

**En inglés:**
> "We are an AI-powered CRM SaaS platform that helps businesses automate customer service across WhatsApp, Instagram, and Facebook, and monitor advertising campaign performance in a single dashboard."

---

## 🔧 ACCIONES NECESARIAS ANTES DE ENVIAR

1. ✅ **FIXED** - Agregar función `handleFacebookMessages` (ya commiteado)
2. 🔴 **Corregir respuesta de `ads_management`** - No decir que pueden pausar campañas si no pueden
3. 🔴 **Corregir respuesta de `pages_read_engagement`** - Solo DMs, no comentarios
4. 🟡 **Implementar pausar/activar campañas** (opcional) O cambiar la respuesta
5. 🟡 **Reemplazar datos mock en analytics/meta-ads** con datos reales (opcional antes de envío)