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

## 4. pages_read_engagement
**¿Cómo usa tu aplicación este permiso o función?**
Requerimos `pages_read_engagement` para poder leer los mensajes, comentarios y menciones que los clientes finales envían a la página de Facebook del usuario. Al leer estas interacciones, nuestro sistema puede enrutarlas a nuestro CRM centralizado, donde nuestros agentes virtuales de IA procesan las consultas, responden automáticamente a preguntas frecuentes y derivan conversaciones complejas a un agente humano, mejorando la velocidad de respuesta del negocio.

## 5. ads_management
**¿Cómo usa tu aplicación este permiso o función?**
Solicitamos `ads_management` para permitir que nuestros usuarios puedan pausar, activar o ajustar el presupuesto de sus campañas publicitarias activas directamente desde nuestro dashboard de analíticas. Si un usuario nota en nuestro CRM que una campaña no está generando leads rentables o que los agentes virtuales están sobrecargados, pueden usar nuestra interfaz para pausar el anuncio en Meta sin tener que salir de nuestra plataforma y entrar al Administrador de Anuncios.

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
2. Muestra la lista de campañas activas
3. Muestra un botón o acción que permita pausar/activar una campaña (si ya lo tienes implementado, haz clic; si no, muestra la interfaz donde aparecería)
4. Explica que el usuario puede gestionar el estado de sus campañas sin salir del CRM

**Narración sugerida:** *"ads_management allows our users to pause or activate campaigns directly from our dashboard. When an AI agent detects a campaign is underperforming, the user can take immediate action without leaving our platform."*

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
