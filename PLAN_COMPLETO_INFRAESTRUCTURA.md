# Plan Completo: Paginapivot - Servicio de Asistente AI

## 1. Resumen Ejecutivo

Este documento presenta el diseño técnico y plan de negocio completo para **Paginapivot**, un servicio de asistente de inteligencia artificial personalizado estilo OpenClaw. El servicio permite a usuarios comunicarse con una IA por WhatsApp que realiza recordatorios, aprende de interacciones y automatiza tareas para negocios.

---

## 2. Modelo de Negocio

### 2.1 Propuesta de Valor

| Segmento | Propuesta |
|----------|-----------|
| **Usuarios individuales** | Asistente personal 24/7 que recuerda preferencias, hace recordatorios y organiza la vida |
| **Emprendedores** | Asistente que automatiza atención al cliente, gestiona agenda y maneja consultas |
| **Pequeños negocios** | Chatbot inteligente con memoria, conexión a Google Sheets y configuración automática |

### 2.2 Diferenciadores

- **Enfoque local**: Atención en español, horarios LatAm
- **Tecnología**: IA avanzada con memoria persistente + OpenClaw
- **Económico**: Mejor precio del mercado
- **Fácil configuración**: El cliente conecta su número de WhatsApp sin necesidad de conocimientos técnicos

---

## 3. Ofertas para Clientes

### 3.1 Funciones Principales del Asistente

**Comunicación y Canales:**
- WhatsApp (canal principal)
- Telegram (opcional)
- WebChat (futuro)

**Gestión de Memoria:**
- Memoria persistente 24/7
- Recuerda preferencias y contexto de cada cliente
- Aprendizaje continuo de interacciones

**Automation y Herramientas:**
- Automatización de navegador (Chrome/Chromium)
- Relleno de formularios automáticos
- Extracción de datos de sitios web
- Cron jobs (tareas programadas)
- Webhooks (disparadores HTTP)
- Notificaciones del sistema

**Calendario y Recordatorios:**
- Integración con Google Calendar
- Advanced Calendar skill con NLP
- Tareas programadas (wakeups)
- Briefing diario automático

**Integraciones:**
- Google Sheets como base de datos
- Información estática del negocio

### 3.2 Planes de Precios

| Plan | Precio | Funciones |
|------|--------|-----------|
| **Básico** | $0/mes | 50 mensajes/mes, recordatorios básicos, memoria limitada |
| **Personal** | $9.99/mes | Mensajes ilimitados, recordatorios avanzados, calendario, aprendizaje completo |
| **Premium** | $19.99/mes | Todo Personal + integraciones avanzadas, prioridad en respuestas |
| **Emprendedor** | $29.99/mes | Todo Premium + gestión de proyectos, búsqueda web, automatizaciones |
| **Pro** | $49.99/mes | Todo Emprendedor + múltiples agentes, integraciones API, informes |
| **Starter Negocio** | $79.99/mes | 1 agente, hasta 500 conversaciones/mes, chatbot básico, gestión de citas |
| **Negocios** | $149.99/mes | 3 agentes, conversaciones ilimitadas, CRM básico, integraciones |
| **Enterprise** | $299.99/mes | Agentes ilimitados, API completa, soporte dedicado |

---

## 4. Arquitectura del Sistema

### 4.1 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ARQUITECTURA DEL SISTEMA                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                 INTERFAZ DE ADMINISTRACIÓN                    │  │
│  │                 (Panel Web para Vendedor)                      │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │  │
│  │  │ Clientes    │ │ Configuración│ │ Información del Negocio  │ │  │
│  │  │ (CRUD)      │ │ IA per client│ │ (estático)              │ │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────────┘ │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
│                               │                                      │
│                    ┌──────────▼──────────┐                          │
│                    │   API RESTful       │                          │
│                    │   (Node.js/Express)│                          │
│                    └──────────┬──────────┘                          │
│                               │                                      │
│  ┌───────────────────────────┼───────────────────────────────────┐  │
│  │                    ┌──────▼──────┐                             │  │
│  │                    │   OpenClaw  │ ◄── Cerebro del sistema     │  │
│  │                    │   (Docker)  │                             │  │
│  │                    └──────┬──────┘                             │  │
│  │                           │                                      │  │
│  │    ┌──────────────────────┼──────────────────────┐              │  │
│  │    │                      │                      │              │  │
│  │ ┌──▼─────┐  ┌─────────────┴─────────────┐  ┌────▼──────────┐  │  │
│  │ │Memory  │  │    Google Sheets API       │  │   Ollama      │  │  │
│  │ │持久性  │  │    (Base de datos)         │  │   (Local)     │  │  │
│  │ └────────┘  └────────────────────────────┘  └───────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                               │                                      │
│                    ┌──────────▼──────────┐                          │
│                    │  Meta WhatsApp API  │                          │
│                    │  (Webhooks)         │                          │
│                    └─────────────────────┘                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Componentes del Sistema

| Componente | Tecnología | Descripción |
|------------|------------|-------------|
| **Panel Admin** | React + Node.js | Interfaz para el vendedor |
| **API Core** | Node.js + Express | Gestión de clientes y configuraciones |
| **OpenClaw** | Docker | Cerebro de IA (repositorio GitHub) |
| **Base de datos** | PostgreSQL | Almacenamiento de clientes y configuraciones |
| **Cache** | Redis | Cacheo de sesiones y respuestas |
| **WhatsApp** | Meta Cloud API | Canal de comunicación con clientes |
| **Google Sheets** | Google Sheets API | Base de datos de productos/servicios |
| **Ollama** | Docker | Modelos de IA locales (fallback) |

### 4.3 Flujo de Comunicación

```
┌─────────────┐      WhatsApp       ┌─────────────┐
│  Cliente    │ ◄─────────────────► │   Meta API   │
│  (Usuario)  │                    │  (Webhooks)  │
└─────────────┘                    └──────┬───────┘
                                          │
                                          ▼
                                 ┌─────────────────┐
                                 │   OpenClaw      │
                                 │   (Procesa y    │
                                 │    responde)    │
                                 └────────┬────────┘
                                          │
                         ┌────────────────┼────────────────┐
                         │                │                │
                         ▼                ▼                ▼
                   ┌──────────┐   ┌──────────────┐   ┌──────────┐
                   │  Memory  │   │ Google Sheets│   │  Ollama  │
                   │ (Datos)  │   │  (Productos) │   │   (IA)   │
                   └──────────┘   └──────────────┘   └──────────┘
```

---

## 5. Interfaz de Administración (Panel Web)

### 5.1 Propósito

Panel web accesible únicamente por el vendedor/administrador de "Paginapivot" para configurar todos los aspectos del servicio para cada cliente.

### 5.2 Módulos del Panel

| Módulo | Funcionalidad |
|--------|---------------|
| **Gestión de Clientes** | Agregar, editar, eliminar clientes; asignar número de WhatsApp |
| **Configuración IA** | Seleccionar modelo AI, API key por cliente |
| **Información del Negocio** | Datos estáticos del negocio (dirección, horarios, métodos de pago) |
| **Google Sheets** | Conectar hojas de cálculo con productos/servicios |
| **Estadísticas** | Mensajes enviados, conversaciones, uso de tokens |
| **Plantillas** | Respuestas predefinidas para cada negocio |

### 5.3 Estructura de Datos del Cliente

```json
{
  "id": "uuid",
  "nombre": "Nombre del Negocio",
  "telefono": "+1234567890",
  "configuracion_ia": {
    "modelo": "gpt-4o-mini",
    "api_key": "sk-...",
    "temperatura": 0.7,
    "system_prompt": "Eres el asistente de..."
  },
  "informacion_negocio": {
    "nombre_comercial": "...",
    "direccion": "...",
    "horario": "...",
    "metodos_pago": ["efectivo", "transferencia", "Yape"],
    "sitio_web": "https://...",
    "redes_sociales": {...}
  },
  "google_sheets": {
    "sheet_id": "...",
    "hoja_productos": "Productos",
    "hoja_servicios": "Servicios"
  },
  "whatsapp_config": {
    "phone_number_id": "...",
    "access_token": "...",
    "webhook_verify_token": "..."
  },
  "estado": "activo",
  "fecha_creacion": "2024-01-01",
  "plan": "negocios"
}
```

---

## 6. Integración con Meta WhatsApp API

### 6.1 Opciones de Configuración

**Opción A: WhatsApp API Cloud (Meta) - RECOMENDADA**

| Aspecto | Detalle |
|---------|---------|
| **Costo** | $0-0.03/mensaje (depende del tipo) |
| **Verificación de negocio** | No requerida para comenzar |
| **Limitaciones iniciales** | 50 conversaciones gratuitas/mes |
| **Escalabilidad** | Disponible al escalar a producción |

**Opción B: BSP (Business Solution Provider)**

| Proveedor | Costo Aproximado |
|-----------|------------------|
| Twilio | $0.01-0.05/mensaje |
| 360Dialog | $0.008-0.02/mensaje |
| WPPConnect | Gratuito (self-hosted) |

### 6.2 Configuración de Webhooks

El sistema recibe mensajes de WhatsApp a través de webhooks configurados en la API de Meta.

**Endpoint de Webhook:**
```
POST /webhook/whatsapp
```

**Eventos a manejar:**

| Evento | Descripción |
|--------|-------------|
| `messages` | Mensajes entrantes de clientes |
| `message_status` | Estado de entrega (enviado, leído) |
| `contacts` | Actualización de contactos |

### 6.3 Proceso de Conexión del Cliente

El cliente puede conectar su número de WhatsApp de forma sencilla:

```
1. Cliente inicia proceso en el panel de Paginapivot
2. Sistema genera URL de Meta OAuth
3. Cliente autoriza en Meta (ventana emergente)
4. Meta verifica el teléfono (SMS)
5. Cliente ingresa código de verificación
6. Sistema configura webhook automáticamente
7. ¡Listo! Asistente activo
```

### 6.4 Alternativa: Sin Verificación de Negocio

Es posible iniciar WhatsApp API **sin verificar el negocio**:

| Característica | Sin Verificación | Con Verificación |
|----------------|-------------------|-------------------|
| Mensajes entrantes | ✅ | ✅ |
| Mensajes salientes (plantillas) | ✅ | ✅ |
| 50 conversaciones gratis/mes | ✅ | ✅ |
| Escalabilidad | ❌ Limitado | ✅ Ilimitada |
| Verificación azul (✓) | ❌ | ✅ |

---

## 7. Integración con Google Sheets

### 7.1 Propósito

Los pequeños negocios suelen usar Google Sheets para gestionar su inventario, lista de precios y bases de datos de clientes. El sistema se conecta a estas hojas para proporcionar información actualizada en las conversaciones.

### 7.2 Estructura de Hojas Soportadas

**Hoja de Productos:**

| Columna | Descripción |
|--------|-------------|
| `codigo` | Código del producto |
| `nombre` | Nombre del producto |
| `descripcion` | Descripción detallada |
| `precio` | Precio unitario |
| `stock` | Cantidad disponible |
| `categoria` | Categoría del producto |
| `imagen` | URL de imagen |

**Hoja de Servicios:**

| Columna | Descripción |
|--------|-------------|
| `codigo` | Código del servicio |
| `nombre` | Nombre del servicio |
| `descripcion` | Descripción del servicio |
| `precio` | Precio del servicio |
| `duracion` | Duración estimada |

**Hoja de Clientes:**

| Columna | Descripción |
|--------|-------------|
| `telefono` | Número de teléfono |
| `nombre` | Nombre del cliente |
| `ultima_compra` | Fecha de última compra |
| `total_compras` | Total gastado |
| `preferencias` | Productos favoritos |

### 7.3 Flujo de Integración

```
Cliente conecta Google Sheets
         │
         ▼
 Sistema solicita acceso OAuth
         │
         ▼
 Cliente autoriza en Google
         │
         ▼
 Sistema lee estructura de hojas
         │
         ▼
 OpenClaw usa datos en conversaciones
```

---

## 8. Sistema de Información Estática del Negocio

### 8.1 Datos Configurables

El vendedor ingresa esta información desde el panel administrativo y el asistente la usa para responder preguntas frecuentes.

| Categoría | Campos |
|-----------|--------|
| **Información General** | Nombre comercial, descripción, misión, visión |
| **Ubicación** | Dirección, mapa (URL Google Maps), instrucciones |
| **Horario** | Horario de atención por día |
| **Contacto** | Teléfono principal, email, redes sociales |
| **Métodos de Pago** | Efectivo, transferencia, tarjetas, apps de pago (Yape, Plin) |
| **Política** | Envíos, devoluciones, garantías |
| **Preguntas Frecuentes** | FAQ configurable |

### 8.2 Prompt Dinámico para OpenClaw

```markdown
Eres el asistente virtual de {nombre_comercial}.

INFORMACIÓN DEL NEGOCIO:
- Horario: {horario}
- Dirección: {direccion}
- Métodos de pago aceptados: {metodos_pago}
- Política de envíos: {politica_envios}

PRODUCTOS DISPONIBLES:
{formato_tabla_productos}

SERVICIOS OFRECIDOS:
{formato_tabla_servicios}

INSTRUCCIONES:
1. Siempre salute amablemente con el nombre del negocio
2. Cuando pregunten por productos, consulta la hoja de Google Sheets
3. Proporciona información precisa de precios y disponibilidad
4. Para pedidos, solicita los datos necesarios y confirma
5. Si no tienes información, sé honesto y ofrece help adicional
```

---

## 9. Configuración de IA por Cliente

### 9.1 Opciones de Modelos

| Modelo | Proveedor | Costo | Uso Recomendado |
|--------|-----------|-------|-----------------|
| GPT-4o mini | OpenAI | ~$0.002/1K tokens | Alto volumen |
| GPT-4o | OpenAI | ~$0.015/1K tokens | Calidad alta |
| Claude 3 Haiku | Anthropic | ~$0.001/1K tokens | Balance |
| Claude 3 Sonnet | Anthropic | ~$0.003/1K tokens | Mejor comprensión |
| Ollama (local) | Local | Gratis | Presupuesto limitado |

### 9.2 Sistema de Routing

El sistema selecciona el modelo basado en la complejidad de la consulta:

```
Consulta del usuario
         │
         ▼
┌─────────────────┐
│ Clasificador    │ ───► ¿Es consulta simple? (precio, disponibilidad)
│ de intención    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
   SÍ         NO
    │         │
    ▼         ▼
Ollama     Modelo Premium
(local)    (GPT-4o/Claude)
```

### 9.3 API Keys por Cliente

Cada cliente puede tener su propia API key configurada:

```json
{
  "clientes": [
    {
      "id": "cliente_001",
      "nombre": "Tienda de Ropa XYZ",
      "ia_config": {
        "proveedor": "openai",
        "api_key": "sk-proj-...",
        "modelo": "gpt-4o-mini",
        "limite_mensual": 5000
      }
    },
    {
      "id": "cliente_002",
      "nombre": "Restaurante ABC",
      "ia_config": {
        "proveedor": "anthropic",
        "api_key": "sk-ant-...",
        "modelo": "claude-3-haiku"
      }
    }
  ]
}
```

---

## 10. OpenClaw - Cerebro del Sistema

### 10.1 Qué es OpenClaw

OpenClaw es un agente de IA de código abierto que actúa como el cerebro del sistema. Puede:

- Comunicarse por múltiples canales (WhatsApp, Telegram, Discord, etc.)
- Ejecutar automatización del navegador
- Gestionar memoria persistente
- Ejecutar tareas programadas (cron)
- Conectar con APIs externas
- Ejecutar código y scripts

### 10.2 Repositorio Oficial

```
GitHub: https://github.com/openclaw/openclaw
```

### 10.3 Instalación en Docker

```yaml
version: '3.8'

services:
  openclaw:
    image: openclaw/openclaw:latest
    ports:
      - "8080:8080"
    environment:
      - OPENCLAW_PROVIDER=openai
      - OPENCLAW_API_KEY=${OPENCLAW_API_KEY}
    volumes:
      - ./openclaw-config:/app/config
      - ./openclaw-memory:/app/memory
    restart: unless-stopped
```

### 10.4 Skills Disponibles (5,000+)

| Categoría | Ejemplos |
|-----------|----------|
| **Calendario** | Google Calendar, Advanced Calendar |
| **Productividad** | Notas, tareas, gestión de proyectos |
| **Navegación** | Browser automation, web scraping |
| **Comunicación** | WhatsApp, Telegram, Discord |
| **Datos** | Google Sheets, SQLite, archivos |
| **Sistema** | Ejecución de comandos, cron jobs |

---

## 11. Infraestructura

### 11.1 Servidor Requerido

| Recurso | Configuración Mínima | Configuración Recomendada |
|---------|----------------------|---------------------------|
| RAM | 6 GB (tienes) | 8-16 GB |
| CPU | 2 cores | 4+ cores |
| Almacenamiento | 40 GB SSD | 100 GB SSD |
| SO | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| Docker | Sí | Sí |

### 11.2 EasyPanel

EasyPanel es un panel de administración Docker que permite gestionar contenedores desde una interfaz web.

**Instalación de EasyPanel:**

```bash
# Instalación en VPS
curl -sSL https://get.easypanel.io | sh
```

**Beneficios:**
- Interfaz gráfica para Docker
- Gestión de contenedores sin CLI
- Certificados SSL automáticos
- Backups integrados

### 11.3 Estructura de Contenedores

```yaml
version: '3.8'

services:
  # Panel administrativo
  panel-admin:
    image: paginapivot/panel-admin:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://...
      - JWT_SECRET=...
    volumes:
      - ./panel-data:/app/data

  # OpenClaw
  openclaw:
    image: openclaw/openclaw:latest
    ports:
      - "8080:8080"
    environment:
      - OPENCLAW_PROVIDER=openai
      - OPENCLAW_API_KEY=${OPENCLAW_API_KEY}
    volumes:
      - ./openclaw-config:/app/config
      - ./openclaw-memory:/app/memory

  # Base de datos
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=paginapivot
      - POSTGRES_USER=...
      - POSTGRES_PASSWORD=...
    volumes:
      - ./postgres-data:/var/lib/postgresql/data

  # Redis para caché
  redis:
    image: redis:7-alpine
    volumes:
      - ./redis-data:/data
```

### 11.4 Costos de Infraestructura

| Componente | Costo Mensual |
|------------|---------------|
| VPS Hostinger (6GB RAM) | $6-10/mes |
| Dominio propio | $2-5/mes |
| SSL (Let's Encrypt) | Gratis |
| Twilio WhatsApp (opcional) | ~$0.01/mensaje |
| OpenAI API (respaldo) | ~$50-150/mes |
| **Total** | **$60-170/mes** |

---

## 12. Casos de Uso Específicos

### 12.1 Consulta de Productos

```
Cliente: "¿Cuánto cuesta el celular Samsung Galaxy?"
         │
         ▼
OpenClaw consulta Google Sheets
         │
         ▼
Retorna: "El Samsung Galaxy S24 tiene un precio de $699. 
          Tenemos 5 unidades disponibles. ¿Te interesa?"
```

### 12.2 Información del Negocio

```
Cliente: "¿A qué hora abren?"
         │
         ▼
OpenClaw consulta información estática
         │
         ▼
Retorna: "¡Hola! Nuestro horario es:
          Lunes a Viernes: 9am - 8pm
          Sábados: 9am - 6pm"
```

### 12.3 Recordatorios

```
Cliente: "Recuérdame comprar leche a las 6pm"
         │
         ▼
OpenClaw registra recordatorio en memoria
         │
         ▼
A las 6pm: "¡No olvides comprar leche!"
```

### 12.4 Pedido

```
Cliente: "Quiero comprar el iPhone 15"
         │
         ▼
OpenClaw: "Tenemos el iPhone 15 en $999. 
           ¿Cuántas unidades deseas? 
           ¿Qué método de pago prefieres?"
```

---

## 13. Roadmap de Implementación

### Fase 1: Fundamentos (Semanas 1-2)

- [ ] Instalar EasyPanel en VPS
- [ ] Configurar Docker y contenedores base
- [ ] Instalar OpenClaw
- [ ] Configurar WhatsApp/Telegram
- [ ] Configurar modelo híbrido (Ollama + OpenAI)
- [ ] Pruebas internas

### Fase 2: Panel de Administración (Semanas 3-4)

- [ ] Desarrollar panel web para vendedor
- [ ] CRUD de clientes
- [ ] Configuración de información del negocio
- [ ] Integración con Google Sheets
- [ ] Configuración de API key por cliente

### Fase 3: Integración WhatsApp (Semanas 5-6)

- [ ] Configurar Meta Cloud API
- [ ] Webhook para mensajes entrantes
- [ ] Flujo de conexión de número del cliente
- [ ] Sistema de sesiones por cliente

### Fase 4: Producto Mínimo Viable (Semanas 7-8)

- [ ] 5 usuarios beta gratuitos
- [ ] Recopilar feedback
- [ ] Ajustar funcionalidades
- [ ] Documentación

### Fase 5: Lanzamiento (Semanas 9-12)

- [ ] Lanzamiento oficial
- [ ] Plan Básico gratuito
- [ ] Primeros 20-50 usuarios pagos
- [ ] Marketing inicial

### Fase 6: Escalamiento (Meses 3-6)

- [ ] Agregar más canales
- [ ] Desarrollar skills personalizados
- [ ] Planes para negocios
- [ ] Automatización deOnboarding

---

## 14. Métricas de Éxito

| Métrica | Objetivo Mes 1 | Objetivo Mes 3 | Objetivo Mes 6 |
|---------|---------------|----------------|----------------|
| Usuarios registrados | 50 | 200 | 500 |
| Usuarios pagos | 10 | 50 | 150 |
| MRR | $100 | $1,000 | $5,000 |
| Retención | 70% | 75% | 80% |
| NPS | 40+ | 50+ | 60+ |

---

## 15. Seguridad y Consideraciones

### 15.1 Medidas de Seguridad

| Medida | Descripción |
|--------|-------------|
| **TLS/SSL** | Todos los endpoints con HTTPS |
| **API Keys** | Almacenadas en variables de entorno |
| **Validación** | Sanitización de entrada de usuario |
| **Rate Limiting** | Previene abuso de recursos |
| **Logs** | Registro de actividad para auditoría |
| **Aislamiento** | Cada cliente en sesión aislada |

### 15.2 Privacidad de Datos

- Los datos de los clientes se almacenan en PostgreSQL encriptada
- Las API keys de los clientes nunca se exponen
- La memoria de cada cliente está aislada
- Cumplimiento con normativas de protección de datos

---

## 16. Tecnologías a Utilizar

| Componente | Tecnología |
|------------|------------|
| Backend | Node.js + Express |
| Base de datos | PostgreSQL |
| Cache | Redis |
| IA | OpenClaw + Ollama |
| Frontend Panel | React + Tailwind |
| WhatsApp | Meta Cloud API |
| Hojas de cálculo | Google Sheets API |
| Contenedores | Docker |
| Hosting | EasyPanel (VPS Hostinger) |

---

## 17. Anexos

### A. Glosario de Términos

| Término | Definición |
|---------|------------|
| **OpenClaw** | Agente de IA de código abierto |
| **Meta Cloud API** | API oficial de WhatsApp Business |
| **Webhook** | Endpoint que recibe eventos de WhatsApp |
| **Skill** | Módulo de funcionalidad para OpenClaw |
| **Session** | Contexto de conversación por cliente |
| **WABA** | WhatsApp Business Account |

### B. Referencias

- Repositorio OpenClaw: https://github.com/openclaw/openclaw
- Documentación Meta WhatsApp: https://developers.facebook.com/docs/whatsapp
- EasyPanel: https://easypanel.io
- Google Sheets API: https://developers.google.com/sheets/api

---

## 18. Información de Contacto

| Campo | Valor |
|-------|-------|
| **Empresa** | Paginapivot |
| **Servicio** | Asistentes de IA para negocios |
| **Website** | [Por definir] |
| **Email** | [Por definir] |
| **WhatsApp** | [Por definir] |

---

*Documento creado: Abril 2026*
*Versión: 1.0*
