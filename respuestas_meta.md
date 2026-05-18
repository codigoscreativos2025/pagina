# Respuestas para la Revisión de la Aplicación (Meta App Review)

**Descripción de la empresa:**
Somos una plataforma SaaS de CRM e Inteligencia Artificial que ayuda a las empresas a automatizar su atención al cliente y analizar el rendimiento de sus campañas publicitarias mediante agentes virtuales.

---

## 1. pages_show_list
**¿Cómo usa tu aplicación este permiso o función?**
Nuestra aplicación utiliza el permiso `pages_show_list` durante el proceso de configuración de integraciones (onboarding). Cuando un usuario de nuestro CRM conecta su cuenta de Facebook, usamos este permiso para mostrarle una lista de las páginas de Facebook que administra. Esto le permite seleccionar exactamente qué página desea vincular a nuestro sistema para que nuestros agentes virtuales puedan interactuar con sus clientes. No utilizamos esta información para ningún otro propósito más allá de la vinculación inicial y configuración del perfil del cliente.

## 2. business_management
**¿Cómo usa tu aplicación este permiso o función?**
Usamos el permiso `business_management` para permitir a nuestros usuarios gestionar y vincular sus cuentas publicitarias y de negocios de Facebook directamente desde nuestra plataforma SaaS. Este permiso nos permite leer la estructura del Business Manager del cliente para que pueda seleccionar correctamente su cuenta de Ads, páginas y catálogos que desea conectar con nuestro CRM. Esto es esencial para que la plataforma pueda proporcionar analíticas publicitarias consolidadas.

## 3. ads_read
**¿Cómo usa tu aplicación este permiso o función?**
Nuestra aplicación (Pivot.AI) es un CRM que incluye un dashboard analítico. Usamos el permiso `ads_read` para obtener en tiempo real las métricas de rendimiento de las campañas publicitarias del usuario (como clics, conversiones, gasto y alcance). Esta información se procesa y se muestra en gráficos dentro de nuestro panel, permitiendo a los dueños de negocios monitorear su ROI directamente en el mismo lugar donde sus agentes virtuales atienden a los leads generados por esos mismos anuncios.

## 4. pages_manage_metadata
**¿Cómo usa tu aplicación este permiso o función?**
Usamos `pages_manage_metadata` para permitir a nuestros usuarios conectar y configurar sus Páginas de Facebook con nuestro CRM. Este permiso nos permite suscribir nuestra aplicación a los webhooks de la Página, de modo que podamos recibir notificaciones en tiempo real cuando los clientes envían mensajes. También lo usamos para leer y mostrar el nombre de la Página y su información básica durante el proceso de configuración, asegurando que el usuario conecte la Página correcta a nuestro sistema.

## 5. pages_read_engagement
**¿Cómo usa tu aplicación este permiso o función?**
Requerimos `pages_read_engagement` para leer los mensajes directos (DMs) que los clientes finales envían a la Página de Facebook del usuario. Al recibir estos mensajes a través de webhooks, nuestro sistema los enruta al CRM centralizado donde los agentes virtuales de IA procesan las consultas y responden automáticamente. **Nota:** No leemos comentarios públicos ni menciones en publicaciones, solo mensajes directos enviados a través de Messenger.

## 6. pages_messaging
**¿Cómo usa tu aplicación este permiso o función?**
Usamos `pages_messaging` para enviar respuestas a los mensajes que los clientes envían a la Página de Facebook del usuario. Cuando un cliente escribe a la Página, nuestro agente de IA procesa el mensaje y genera una respuesta contextual que es enviada de vuelta a través de la API de Messenger. Esto permite a las empresas atender a sus clientes 24/7 sin intervención manual. También usamos este permiso para marcar mensajes como leídos y mostrar indicadores de escritura para mejorar la experiencia del usuario final.

## 7. pages_utility_messaging
**¿Cómo usa tu aplicación este permiso o función?**
Utilizamos `pages_utility_messaging` para enviar mensajes transaccionales y de utilidad a los clientes que han interactuado previamente con la Página del usuario. Estos incluyen confirmaciones de citas, actualizaciones de estado de pedidos, recordatorios de reservas y otras notificaciones relacionadas con transacciones específicas iniciadas por el usuario. Todos los mensajes siguen las políticas de Messaging Features de Meta y solo se envían dentro de la ventana de 24 horas o usando plantillas aprobadas para casos de uso específicos.

## 5. ads_management
**¿Cómo usa tu aplicación este permiso o función?**
Solicitamos `ads_management` para mostrar a los usuarios información consolidada de sus campañas publicitarias (estado, presupuesto, métricas) en un dashboard unificado con su CRM. Esto permite a los dueños de negocios ver qué campañas están generando leads y tomar decisiones informadas. **Actualmente la funcionalidad es de solo lectura**; los usuarios pueden ver el estado de sus campañas pero no modificarlas desde nuestra plataforma.

## 6. instagram_business_basic
**¿Cómo usa tu aplicación este permiso o función?**
Usamos `instagram_business_basic` para leer la información básica del perfil de la cuenta profesional de Instagram del usuario (como nombre, foto de perfil y métricas públicas). Esto nos permite identificar correctamente la cuenta dentro de nuestro CRM y vincularla a su perfil corporativo, de modo que cuando el usuario gestione sus comunicaciones, tenga la certeza visual de con qué cuenta de Instagram está operando.

## 7. instagram_business_manage_messages
**¿Cómo usa tu aplicación este permiso o función?**
Este permiso es el núcleo de nuestra integración con Instagram. Usamos `instagram_business_manage_messages` para recibir los DMs y respuestas a historias a través de webhooks. Los mensajes entrantes se muestran en la bandeja de entrada omnicanal de nuestro CRM, donde los agentes de inteligencia artificial procesan el texto y responden automáticamente a los clientes para agendar citas, dar soporte técnico o vender productos.

## 8. whatsapp_business_messaging
**¿Cómo usa tu aplicación este permiso o función?**
Nuestra plataforma automatiza la atención al cliente. Usamos `whatsapp_business_messaging` para enviar y recibir mensajes de WhatsApp en nombre de la empresa de nuestro usuario. Cuando un cliente final escribe al número de WhatsApp Business del negocio, nuestra API recibe el webhook y el Agente de IA entrenado genera una respuesta contextual que es enviada de vuelta a través de esta API para mantener conversaciones fluidas 24/7.

## 9. whatsapp_business_management
**¿Cómo usa tu aplicación este permiso o función?**
Usamos `whatsapp_business_management` para ayudar a nuestros clientes a configurar su línea de WhatsApp Cloud API directamente desde nuestro panel. Esto incluye la gestión de plantillas de mensajes (templates) requeridas por WhatsApp para iniciar conversaciones (outbound). Nuestros usuarios pueden crear, editar y solicitar aprobación de estas plantillas desde el CRM para lanzar campañas de notificaciones a sus bases de datos de leads.

## 10. public_profile
**¿Cómo usa tu aplicación este permiso o función?**
Utilizamos el permiso `public_profile` de forma exclusiva para facilitar el inicio de sesión ("Login with Facebook"). Esto nos permite obtener el nombre y la foto de perfil del administrador que está creando una cuenta en nuestro CRM, ofreciendo una experiencia de registro rápida, segura y sin fricciones, sin que tenga que recordar contraseñas adicionales.

## 11. Marketing API Access Tier
**¿Cómo usa tu aplicación este permiso o función?**
Nuestra plataforma consolida datos publicitarios en un dashboard de inteligencia de negocios (BI). Necesitamos acceso a la Marketing API para ejecutar consultas sobre el rendimiento histórico y en tiempo real de las campañas (Insights API). Al extraer datos de impresiones, gasto y costo por lead, nuestros algoritmos pueden alertar a los usuarios sobre fluctuaciones en el costo de adquisición de clientes (CAC) y permitirles apagar anuncios poco rentables desde el mismo CRM.

---

## 📌 GUÍA DE GRABACIÓN POR PERMISO

> **Reglas generales para TODOS los videos:**
> - Graba con OBS Studio o Loom (screencast real, NO animación)
> - La barra de URL del navegador DEBE ser visible en todo momento
> - Muestra `https://agents.pivotsoluciones.com` en la barra
> - Duración ideal: 30-90 segundos por video
> - Idioma: La app puede estar en español, pero si puedes narrar en inglés es mejor

---

### 🎬 Video para `pages_show_list`
**Qué grabar:**
1. Abre `agents.pivotsoluciones.com/integrations`
2. Haz clic en **"Conectar con Facebook"** en la tarjeta de Instagram o WhatsApp
3. Muestra la ventana emergente de Facebook Login donde aparece la lista de Páginas que administras
4. Selecciona una Página de la lista
5. Muestra cómo la app confirma la conexión y muestra el nombre de la Página seleccionada en la tarjeta de integración

**Narración sugerida:** *"When a user clicks Connect, we use pages_show_list to display their Facebook Pages so they can choose which Page to link with our CRM."*

---

### 🎬 Video para `pages_manage_metadata`
**Qué grabar:**
1. Abre `agents.pivotsoluciones.com/integrations`
2. Haz clic en **"Conectar con Facebook"** en la tarjeta de Facebook Messenger
3. Muestra la ventana de permisos de Facebook
4. Acepta y muestra cómo la tarjeta cambia a "✅ Conectado"
5. Ve a `/crm` y muestra que los mensajes de Facebook llegan correctamente

**Narración sugerida:** *"We use pages_manage_metadata to subscribe to webhooks for the user's Facebook Page. This allows us to receive real-time notifications when customers send messages, and to display the Page name during setup."*

---

### 🎬 Video para `pages_messaging`
**Qué grabar:**
1. Abre `agents.pivotsoluciones.com/crm`
2. Muestra una conversación de Facebook Messenger (ícono 💬)
3. Muestra el mensaje entrante del cliente
4. Muestra la respuesta automática del agente de IA
5. Si es posible, desde otra cuenta de Facebook envía un mensaje y muestra cómo llega en tiempo real

**Narración sugerida:** *"pages_messaging allows us to send responses back to customers who message the user's Facebook Page. Our AI agents process incoming messages and automatically reply through Messenger, providing 24/7 customer support."*

---

### 🎬 Video para `pages_utility_messaging`
**Qué grabar:**
1. Abre `agents.pivotsoluciones.com/templates`
2. Muestra una plantilla de WhatsApp o Facebook configurada para notificaciones transaccionales
3. Muestra el campo de uso: "Confirmación de cita" o "Actualización de pedido"
4. Si tienes ejemplos de mensajes enviados, muéstralos en el CRM

**Narración sugerida:** *"We use pages_utility_messaging to send transactional messages like appointment confirmations and order updates. These messages are only sent within the 24-hour window or using approved templates for specific use cases."*

---

### 🎬 Video para `pages_read_engagement`
**Qué grabar:**
1. Abre `agents.pivotsoluciones.com/crm`
2. Muestra la bandeja de entrada con conversaciones activas
3. Haz clic en una conversación que venga de Facebook/Instagram
4. Muestra los mensajes entrantes del cliente (DMs de Messenger/Instagram)
5. Muestra cómo el agente de IA o el usuario responde desde el CRM
6. Resalta el indicador de plataforma (ícono de Instagram/Facebook junto al nombre del contacto)

**Narración sugerida:** *"We use pages_read_engagement to receive direct messages sent to the user's Facebook Page. These DMs are routed to our CRM inbox where AI agents process and respond to customer inquiries automatically. Note: We only read direct messages, not public comments or mentions."*

---

### 🎬 Video para `business_management`
**Qué grabar:**
1. Abre `agents.pivotsoluciones.com/integrations`
2. Haz clic en **"Conectar con Facebook"** en la tarjeta de Meta Ads
3. Muestra la ventana de permisos de Facebook donde pide acceso al Business Manager
4. Acepta los permisos
5. Muestra cómo la tarjeta de Meta Ads cambia a "✅ Conectado" y aparece el nombre de la cuenta publicitaria
6. Navega a `/meta-ads` y muestra que los datos de campañas se cargan correctamente

**Narración sugerida:** *"We use business_management to read the user's ad accounts structure from their Business Manager, so they can select which ad account to monitor inside our analytics dashboard."*

---

### 🎬 Video para `ads_read`
**Qué grabar:**
1. Ve a `agents.pivotsoluciones.com/meta-ads` (ya con Meta Ads conectado)
2. Muestra el dashboard de Meta Ads con las métricas cargadas: Spend, Impressions, Clicks, CTR
3. Muestra la tabla de campañas activas con sus métricas individuales
4. Si hay gráficos de rendimiento, haz scroll para mostrarlos
5. Resalta que los datos son de solo lectura (no se editan campañas en esta vista)

**Narración sugerida:** *"Our platform uses ads_read to fetch campaign performance metrics — spend, impressions, clicks, and CTR — and displays them in a consolidated dashboard so business owners can monitor ROI alongside their AI agent activity."*

---

### 🎬 Video para `pages_read_engagement`
**Qué grabar:**
1. Abre `agents.pivotsoluciones.com/crm`
2. Muestra la bandeja de entrada del CRM con conversaciones activas
3. Haz clic en una conversación que venga de Facebook/Instagram
4. Muestra los mensajes entrantes del cliente (comentarios o DMs que llegaron desde la Página)
5. Muestra cómo el agente de IA o el usuario responde desde el CRM
6. Resalta el indicador de plataforma (ícono de Instagram/Facebook junto al nombre del contacto)

**Narración sugerida:** *"We use pages_read_engagement to receive messages, comments, and mentions sent to the user's Facebook Page. These are routed to our CRM inbox where AI agents process and respond to customer inquiries automatically."*

---

### 🎬 Video para `ads_management`
**Qué grabar:**
1. Ve a `agents.pivotsoluciones.com/meta-ads`
2. Muestra la lista de campañas activas con sus métricas (Spend, Impressions, Clicks)
3. Muestra el estado de cada campaña (ACTIVE/PAUSED)
4. Resalta que los datos son de solo lectura (no hay botones de editar)
5. Explica que la funcionalidad actual es mostrar métricas consolidadas

**Narración sugerida:** *"We use ads_management to display campaign status and performance metrics to our users. Currently our integration is read-only — users can view their campaign data but all campaign management is done through Meta's own tools. This permission allows us to provide a unified view of ad performance within the CRM."*

---

### 🎬 Video para `instagram_business_basic`
**Qué grabar:**
1. Ve a `agents.pivotsoluciones.com/integrations`
2. Muestra la tarjeta de Instagram
3. Haz clic en **"Conectar con Facebook"**
4. Muestra la ventana de Facebook pidiendo acceso a la cuenta de Instagram vinculada
5. Acepta y muestra cómo la tarjeta cambia a "✅ Conectado" con el nombre de la página/cuenta de Instagram
6. Navega al CRM y muestra que el ícono de Instagram aparece junto a las conversaciones de esa cuenta

**Narración sugerida:** *"We use instagram_business_basic to read the user's professional Instagram account info — name, profile picture — so we can correctly identify and display it inside our CRM."*

**Preguntas personalizadas que Meta puede hacer:**
- *¿Tu app almacena datos de Instagram?* → "Sí, almacenamos el ID de la cuenta y nombre para identificar la integración. No almacenamos fotos ni contenido del feed."
- *¿Cómo protegen los datos?* → "Los tokens se cifran en nuestra base de datos PostgreSQL. Solo el usuario autenticado puede ver sus propias integraciones."

---

### 🎬 Video para `instagram_business_manage_messages`
**Qué grabar:**
1. Abre `agents.pivotsoluciones.com/crm`
2. Muestra la bandeja de entrada con conversaciones
3. Identifica una conversación marcada con el ícono de Instagram 📸
4. Abre esa conversación y muestra mensajes entrantes del cliente (DM de Instagram)
5. Muestra cómo el agente de IA genera una respuesta automática
6. Muestra la respuesta enviada de vuelta al cliente
7. Si es posible, abre Instagram en otra pestaña y muestra que el mensaje llegó efectivamente

**Narración sugerida:** *"instagram_business_manage_messages is the core of our Instagram integration. We receive DMs via webhooks, display them in our omnichannel CRM inbox, and our AI agents automatically respond to customer inquiries 24/7."*

---

### 🎬 Video para `whatsapp_business_messaging`
**Qué grabar:**
1. Abre `agents.pivotsoluciones.com/crm`
2. Muestra una conversación marcada con el ícono de WhatsApp 📱
3. Muestra un mensaje entrante de un cliente por WhatsApp
4. Muestra cómo el agente de IA procesa el mensaje y genera una respuesta
5. Muestra la respuesta enviada al cliente
6. Si puedes, envía un mensaje desde tu teléfono al número de WhatsApp Business y graba cómo aparece en el CRM en tiempo real

**Narración sugerida:** *"We use whatsapp_business_messaging to send and receive WhatsApp messages on behalf of our users' businesses. When a customer writes to their WhatsApp Business number, our AI agent generates a contextual response and sends it back through the API."*

---

### 🎬 Video para `whatsapp_business_management`
**Qué grabar:**
1. Abre `agents.pivotsoluciones.com/integrations`
2. Muestra la tarjeta de WhatsApp
3. Haz clic en **"Conectar con Meta"**
4. Muestra el flujo de Embedded Signup de WhatsApp (la ventana que permite seleccionar/crear un número de WhatsApp Business)
5. Completa el flujo o muestra hasta donde llegue
6. Muestra que la tarjeta cambia a "✅ Conectado"

**Narración sugerida:** *"whatsapp_business_management lets our users set up their WhatsApp Cloud API number directly from our platform. We manage message templates and webhook configuration so users don't need technical knowledge."*

---

### 🎬 Video para `public_profile`
**No requiere video.** Solo confirma que te atendrás al uso permitido. Este permiso es básico y se usa para el Login con Facebook.

**Si Meta pide video:** Simplemente graba la pantalla de Login de `agents.pivotsoluciones.com/login`, haz clic en "Continue with Facebook", muestra la ventana de permisos, y muestra que después del login aparece tu nombre en el header del Dashboard.

---

### 🎬 Video para `Marketing API Access Tier`
**No requiere video de screencast.** Solo requiere que hayas hecho llamadas de prueba a la API.

**Lo que debes verificar antes de enviar:**
1. Asegúrate de tener Meta Ads conectado en tu cuenta
2. Navega a `/meta-ads` y confirma que las métricas se cargan (esto significa que las llamadas a la API funcionan)
3. Si Meta pide evidencia, toma una captura de pantalla del dashboard con datos reales cargados

---

## ✅ Confirmación de Uso Permitido (para todos los permisos)

Copia y pega este texto en cada campo donde diga "Confirma que te atendrás al uso permitido":

> "We confirm that our application, Pivot.AI (agents.pivotsoluciones.com), will strictly adhere to Meta's Platform Policies and the specific usage guidelines for this permission. We will only access the minimum data necessary to provide our CRM and AI automation services. We do not sell, share, or transfer user data to third parties. All access tokens are encrypted and stored securely. Users can revoke access at any time from their Integrations settings page."

---

## 📝 Descripción de la Empresa (para los campos que la piden)

> "Somos una plataforma SaaS de CRM con Inteligencia Artificial que ayuda a las empresas a automatizar la atención al cliente por WhatsApp, Instagram y Facebook, y a monitorear el rendimiento de sus campañas publicitarias en un solo lugar."

**En inglés:**
> "We are an AI-powered CRM SaaS platform that helps businesses automate customer service across WhatsApp, Instagram, and Facebook, and monitor advertising campaign performance in a single dashboard."
