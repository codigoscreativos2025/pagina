# Plan de Ejecución: Pivot Agents

## Resumen Ejecutivo

Este documento establece el plan de ejecución para desarrollar **Pivot Agents**, una plataforma SaaS que permite a usuarios crear y gestionar sus propios agentes de IA personalizados. Los usuarios se registrarán, configurarán su negocio, conectarán sus bases de datos (Google Sheets) y número de WhatsApp, y tendrán acceso a un panel de control completo.

---

## 1. Visión del Producto

### 1.1 Descripción

**Pivot Agents** es una plataforma multi-tenant donde cada usuario (negocio) gestiona su propio agente de IA con:

- Registro con email/password o Google OAuth
- Dashboard personalizado por usuario
- Configuración de su negocio (nombre, prompt, información)
- Conexión a bases de datos (Google Sheets, APIs externas)
- Conexión a WhatsApp (su propio número)
- Selección de modelo de IA
- Gestión de planes y suscripciones

### 1.2 Diferenciador

A diferencia de otros servicios, Pivot Agents ofrece:
- **Acceso de administrador** para Paginapivot (tú) para gestionar todos los usuarios
- **Precios accesibles** para pequeñas empresas
- **Fácil configuración** sin conocimientos técnicos
- **Memoria persistente** que aprende de cada interacción

---

## 2. Estructura de Roles

### 2.1 Roles en el Sistema

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| **Admin (Paginapivot)** | Dueño de la plataforma | Panel de administración completo |
| **Usuario/Negocio** | Cliente que usa el agente | Solo su dashboard |
| **Agente IA** | El agente configurado por el usuario | Sin acceso directo |

### 2.2 Permisos por Rol

#### Admin (Paginapivot)
- Ver todos los usuarios registrados
- Ver y editar configuración de todos los usuarios
- Ver prompts, bases de datos conectadas
- Gestionar planes de todos los usuarios
- Pausar/activar agentes por pago vencido
- Seleccionar modelo de API global
- Ver estadísticas globales
- Acceso a logs y configuraciones técnicas

#### Usuario/Negocio
- Ver y editar su propia configuración
- Conectar/desconectar su WhatsApp
- Conectar/desconectar Google Sheets
- Editar su prompt
- Seleccionar modelo de IA (dentro de su plan)
- Ver sus propias estadísticas
- Gestionar su suscripción

---

## 3. Funcionalidades por Sección

### 3.1 Sección: Pivot Agents (Producto Principal)

#### Registro y Autenticación
- [ ] Registro con email y contraseña
- [ ] Login con Google OAuth
- [ ] Recuperación de contraseña
- [ ] Verificación de email
- [ ] Sesión persistente

#### Dashboard del Usuario
- [ ] Overview del agente (estado, mensajes, uso)
- [ ] Acceso rápido a configuración
- [ ] Estadísticas básicas (conversaciones, mensajes)
- [ ] Notificaciones del sistema

#### Configuración del Negocio
- [ ] Nombre del negocio
- [ ] Descripción del negocio
- [ ] Horario de atención
- [ ] Dirección
- [ ] Métodos de pago aceptados
- [ ] Redes sociales
- [ ] Preguntas frecuentes (FAQ)

#### Prompt del Agente
- [ ] Editor de prompt avanzado
- [ ] Preview del comportamiento
- [ ] Plantillas de prompt predefinidas
- [ ] Variables dinámicas
- [ ] Prueba de respuestas

#### Conexión de Bases de Datos

**Google Sheets:**
- [ ] OAuth con cuenta Google
- [ ] Selector de hojas de cálculo
- [ ] Mapeo de columnas
- [ ] Sincronización automática
- [ ] Cacheo de datos

**Otras Fuentes de Datos:**
- [ ] API REST externa
- [ ] Notion
- [ ] Airtable
- [ ] Base de datos SQL (futuro)

#### Conexión de WhatsApp
- [ ] Instrucciones de configuración (según investigación)
- [ ] Campo para credentials (phone_number_id, access_token)
- [ ] Webhook URL automático
- [ ] Verificación de conexión
- [ ] Prueba de mensajes

#### Selección de Modelo de IA
- [ ] Dropdown de modelos disponibles:
  - GPT-4o mini
  - GPT-4o
  - Claude 3 Haiku
  - Claude 3 Sonnet
  - Ollama (local)
- [ ] Configuración de parámetros (temperatura, etc.)
- [ ] API Key propia o compartida
- [ ] Costos estimados por modelo

#### Gestión de Planes
- [ ] Ver plan actual
- [ ] Cambiar de plan
- [ ] Historial de pagos
- [ ] Facturación

### 3.2 Sección: Plans (Planes)

#### Planes Disponibles

| Plan | Precio | Características |
|------|--------|-----------------|
| **Gratis** | $0 | 50 msgs/mes, 1 agente, basic features |
| **Starter** | $19.99/mes | 500 msgs/mes, Google Sheets |
| **Pro** | $49.99/mes | 2,000 msgs/mes, múltiples canales |
| **Business** | $99.99/mes | 10,000 msgs/mes, API access |
| **Enterprise** | $299.99/mes | Ilimitado, prioridad, soporte |

#### Gestión Admin de Planes
- [ ] Crear/editar planes
- [ ] Asignar plan a usuario
- [ ] Cambiar plan manualmente
- [ ] Pausar servicio por mora
- [ ] Reactivar servicio

### 3.3 Sección: Admin (Acceso de Paginapivot)

#### Gestión de Usuarios
- [ ] Lista de todos los usuarios
- [ ] Buscar por nombre/email/teléfono
- [ ] Ver detalle de cada usuario
- [ ] Editar configuración de usuario
- [ ] Ver prompts de usuarios
- [ ] Ver bases de datos conectadas

#### Gestión de Suscripciones
- [ ] Ver estado de pago de cada usuario
- [ ] Pausar agente por cuota vencida
- [ ] Reactivar agente
- [ ] Generar facturas manual

#### Configuración Global
- [ ] Modelos de IA disponibles (global)
- [ ] API keys globales
- [ ] Configuración de WhatsApp (si es necesario)
- [ ] Límites por defecto

#### Estadísticas Globales
- [ ] Total de usuarios
- [ ] Usuarios activos
- [ ] Mensajes totales
- [ ] Ingresos
- [ ] Uso por plan

---

## 4. Flujo de Usuario

### 4.1 Registro

```
1. Usuario entra a pivotagents.com
2. Click en "Registrarse"
3. Elige: Email/Password o Google
4. Completa formulario
5. Verifica email
6. Entra a Dashboard
7. Completa configuración inicial
8. Activa su agente
```

### 4.2 Configuración Inicial

```
1. Dashboard muestra "Configura tu agente"
2. Paso 1: Información del negocio
   - Nombre, descripción, horario, etc.
3. Paso 2: Prompt del agente
   - Editor con plantillas
4. Paso 3: Conectar datos (opcional)
   - Google Sheets u otras fuentes
5. Paso 4: Conectar WhatsApp (opcional)
   - Instrucciones + credenciales
6. Paso 5: Elegir modelo de IA
7. ¡Listo! Agent activo
```

### 4.3 Uso Diario

```
1. Cliente envía mensaje a WhatsApp del negocio
2. WhatsApp API -> Webhook -> Pivot Agents
3. Sistema identifica usuario por número
4. OpenClaw procesa con configuración del usuario
5. Respuesta -> WhatsApp -> Cliente
```

---

## 5. Arquitectura Técnica

### 5.1 Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| **Frontend Web** | React + Tailwind CSS |
| **Backend API** | Node.js + Express |
| **Base de Datos** | PostgreSQL |
| **Autenticación** | JWT + Google OAuth |
| **IA** | OpenClaw (Docker) |
| **WhatsApp** | Meta Cloud API |
| **Hojas de Cálculo** | Google Sheets API |
| **Contenedores** | Docker + EasyPanel |
| **Hosting** | VPS Hostinger |

### 5.2 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                            │
│    Landing + Dashboard + Auth + Admin Panel                         │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND API (Node.js)                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│  │  Auth        │ │  Users       │ │  Agents      │               │
│  │  Module      │ │  Module      │ │  Module      │               │
│  └──────────────┘ └──────────────┘ └──────────────┘               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│  │  Plans       │ │  Webhooks    │ │  Billing     │               │
│  │  Module      │ │  Module      │ │  Module      │               │
│  └──────────────┘ └──────────────┘ └──────────────┘               │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│   PostgreSQL   │    │    OpenClaw     │    │   WhatsApp     │
│   (Datos)      │    │   (Docker)      │    │   Meta API     │
│                │    │                 │    │                │
│ - Users        │    │ - Procesa IA    │    │ - Webhooks     │
│ - Agents       │    │ - Memoria       │    │ - Mensajes     │
│ - Plans        │    │ - Herramientas  │    │                │
│ - Subscriptions│    │                 │    │                │
└────────────────┘    └────────────────┘    └────────────────┘
                              │
                              ▼
                    ┌────────────────┐
                    │  Google Sheets │
                    │  API           │
                    └────────────────┘
```

### 5.3 Servicios Docker Necesarios

| Servicio | Imagen | Puerto | Descripción |
|----------|--------|--------|-------------|
| **Frontend** | paginapivot/frontend | 3000 | React app |
| **API** | paginapivot/api | 3001 | Backend Node.js |
| **PostgreSQL** | postgres:15 | 5432 | Base de datos |
| **Redis** | redis:7 | 6379 | Cache y sesiones |
| **OpenClaw** | openclaw/openclaw | 8080 | Cerebro IA |

---

## 6. Fases de Implementación

### Fase 1: Fundamentos (Semanas 1-2)

**Objetivo:** Setup técnico y estructura base

| Tarea | Descripción | Estado |
|-------|-------------|--------|
| 1.1 | Configurar proyecto Node.js + Express | Pendiente |
| 1.2 | Configurar PostgreSQL | Pendiente |
| 1.3 | Implementar autenticación (JWT + Google OAuth) | Pendiente |
| 1.4 | Crear modelos de base de datos | Pendiente |
| 1.5 | Setup Docker con docker-compose | Pendiente |

**Entregable:** API base con autenticación funcionando

### Fase 2: Frontend Landing + Auth (Semanas 3-4)

**Objetivo:** Página principal y sistema de registro

| Tarea | Descripción | Estado |
|-------|-------------|--------|
| 2.1 | Crear proyecto React | Pendiente |
| 2.2 | Implementar landing page (extender actual) | Pendiente |
| 2.3 | Crear páginas de Auth (login, register) | Pendiente |
| 2.4 | Integrar Google OAuth | Pendiente |
| 2.5 | Crear Dashboard básico | Pendiente |

**Entregable:** Landing + Auth + Dashboard básico

### Fase 3: Gestión de Usuarios (Semanas 5-6)

**Objetivo:** Funcionalidades del usuario

| Tarea | Descripción | Estado |
|-------|-------------|--------|
| 3.1 | Sección configuración del negocio | Pendiente |
| 3.2 | Editor de prompt | Pendiente |
| 3.3 | Integración Google Sheets | Pendiente |
| 3.4 | Conexión WhatsApp | Pendiente |
| 3.5 | Selector de modelo de IA | Pendiente |

**Entregable:** Dashboard completo de usuario

### Fase 4: Integración OpenClaw (Semanas 7-8)

**Objetivo:** Conectar con OpenClaw y procesar mensajes

| Tarea | Descripción | Estado |
|-------|-------------|--------|
| 4.1 | Instalar OpenClaw en Docker | Pendiente |
| 4.2 | Configurar webhooks de WhatsApp | Pendiente |
| 4.3 | Integrar API de OpenClaw | Pendiente |
| 4.4 | Sistema de routing por usuario | Pendiente |
| 4.5 | Memoria persistente por usuario | Pendiente |

**Entregable:** Sistema de mensajería funcionando

### Fase 5: Planes y Facturación (Semanas 9-10)

**Objetivo:** Sistema de suscripciones

| Tarea | Descripción | Estado |
|-------|-------------|--------|
| 5.1 | Crear sección de planes | Pendiente |
| 5.2 | Integrar sistema de pagos (Stripe/MercadoPago) | Pendiente |
| 5.3 | Gestión de cuotas | Pendiente |
| 5.4 | Notificaciones de pago | Pendiente |
| 5.5 | Panel de facturación | Pendiente |

**Entregable:** Sistema de pagos funcionando

### Fase 6: Panel de Admin (Semanas 11-12)

**Objetivo:** Acceso de Paginapivot

| Tarea | Descripción | Estado |
|-------|-------------|--------|
| 6.1 | Dashboard de admin | Pendiente |
| 6.2 | Lista de usuarios | Pendiente |
| 6.3 | Ver configuración de usuarios | Pendiente |
| 6.4 | Pausar/activar agentes | Pendiente |
| 6.5 | Estadísticas globales | Pendiente |

**Entregable:** Admin completo

### Fase 7: Testing y Lanzamiento (Semanas 13-14)

**Objetivo:** QA y lanzamiento

| Tarea | Descripción | Estado |
|-------|-------------|--------|
| 7.1 | Testing completo | Pendiente |
| 7.2 | Bug fixes | Pendiente |
| 7.3 | Documentación | Pendiente |
| 7.4 | Deploy a producción | Pendiente |
| 7.5 | Lanzamiento beta | Pendiente |

**Entregable:** Producto listo para usuarios

---

## 7. Roadmap Timeline

```
Semana 1-2:   ████████ Fundamentos
Semana 3-4:   ████████ Frontend + Auth
Semana 5-6:   ████████ Gestión de Usuarios
Semana 7-8:   ████████ OpenClaw Integration
Semana 9-10:  ████████ Planes + Facturación
Semana 11-12: ████████ Panel Admin
Semana 13-14: ████████ Testing + Launch
```

---

## 8. Prioridades de Desarrollo

### Alta Prioridad (Deben funcionar)
1. Registro + Login
2. Dashboard básico
3. Configuración del negocio
4. Editor de prompt
5. Conexión WhatsApp (básico)
6. Mensajería funcionando

### Media Prioridad
1. Integración Google Sheets
2. Selección de modelo de IA
3. Sistema de planes
4. Estadísticas de usuario

### Baja Prioridad
1. Facturación completa
2. Notificaciones push
3. Reportes avanzados
4. Múltiples canales

---

## 9. Dependencias Externas

### APIs Requeridas
| API | Propósito | Estado |
|-----|-----------|--------|
| Google OAuth | Login | Requiere configuración |
| Google Sheets API | Datos de hojas | Requiere configuración |
| Meta WhatsApp API | Mensajería | Requiere cuenta developer |
| OpenAI API | Modelos de IA | Requiere API key |
| Anthropic API | Modelos alternativos | Opcional |

### Servicios Requeridos
| Servicio | Propósito | Notas |
|----------|-----------|-------|
| EasyPanel | Gestión de Docker | Ya tienes VPS |
| PostgreSQL | Base de datos | Docker |
| Redis | Cache | Docker |
| Stripe/MercadoPago | Pagos | Para suscripción |

---

## 10. Checklist de Inicio

### Antes de comenzar el desarrollo:

- [ ] Acceso a VPS de Hostinger
- [ ] EasyPanel instalado y funcionando
- [ ] Dominio configurado (pivotagents.com o subdominio)
- [ ] Cuenta de Meta Developer creada
- [ ] Credenciales de Google OAuth (Cloud Console)
- [ ] Cuenta de OpenAI/Anthropic para API
- [ ] Repo de OpenClaw clonado en servidor

### Credenciales necesarias:

```
- DATABASE_URL: postgresql://...
- JWT_SECRET: generated_string
- GOOGLE_CLIENT_ID: from Google Cloud
- GOOGLE_CLIENT_SECRET: from Google Cloud
- META_PHONE_NUMBER_ID: from Meta
- META_ACCESS_TOKEN: from Meta
- OPENAI_API_KEY: sk-...
- ANTHROPIC_API_KEY: sk-ant-...
```

---

## 11. Presupuesto Estimado

### Costos Mensuales Iniciales

| Componente | Costo |
|------------|-------|
| VPS Hostinger (8GB) | $15-20 |
| Dominio | $5 |
| OpenAI API (50 usuarios) | $100-200 |
| Meta WhatsApp (50 conv/mes cada uno) | Gratis |
| Google Sheets | Gratis |
| **Total** | **$120-225** |

### Costos por Usuario

| Plan | Precio | Costo IA Estimado | Margen |
|------|--------|-------------------|--------|
| Gratis | $0 | $0.50 | -$0.50 |
| Starter | $19.99 | $2 | $17.99 |
| Pro | $49.99 | $5 | $44.99 |
| Business | $99.99 | $10 | $89.99 |

---

## 12. Métricas de Éxito

| Métrica | Mes 1 | Mes 3 | Mes 6 |
|---------|-------|-------|-------|
| Usuarios registrados | 20 | 100 | 500 |
| Usuarios activos | 10 | 50 | 250 |
| MRR | $200 | $2,000 | $10,000 |
| Mensajes procesados | 1,000 | 10,000 | 50,000 |
| Retención | 60% | 70% | 75% |

---

## 13. Próximos Pasos Inmediatos

1. **Confirmar este plan** - Revisar y aprobar
2. **Preparar infraestructura** - Setup EasyPanel + servicios base
3. **Iniciar Fase 1** - Comenzar desarrollo
4. **Reunión de kickoff** - Definir responsabilidades

---

*Documento creado: Abril 2026*
*Versión: 1.0*
