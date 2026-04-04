# Plan de Implementación con EasyPanel

## Resumen

Este documento detalla cómo implementar Pivot Agents en tu VPS de Hostinger usando EasyPanel. Evaluamos si la página actual es suficiente y definimos la infraestructura necesaria.

---

## 1. Evaluación: ¿Página Actual Suficiente?

### 1.1 Estado Actual

| Archivo | Propósito | ¿Suficiente? |
|---------|-----------|---------------|
| `index.html` | Landing page actual | ✅ Base para landing |
| `css/styles.css` | Estilos | ✅ Necesita extensión |
| `js/main.js` | Scripts | ✅ Necesita extensión |
| `easypanel.yaml` | Config EasyPanel | ✅ Referencia |

### 1.2 Análisis

**Lo que YA tienes:**
- Landing page completa con animaciones
- Secciones: Hero, Problema, Procesos, Servicios, Referidos, Demo
- Diseño profesional con Tailwind
- Elementos visuales (canvas, animaciones GSAP)

**Lo que FALTA para Pivot Agents:**
- Sección "Pivot Agents" como producto
- Formulario de registro/login
- Dashboard de usuario
- Panel de administración (admin)
- Página de precios/planes

### 1.3 Decisión: Arquitectura de Servicios

| Opción | Descripción | Pros | Contras |
|--------|-------------|------|----------|
| **A: Un servicio** | Todo en un solo app (recomendado) | Simple, un solo deploy | Mayor complejidad |
| **B: Múltiples servicios** | Landing → API → Dashboard分开 | Escalable | Más configuración |

**Recomendación: Opción A - Un solo servicio para el frontend**

La arquitectura recomendada es:
- **1 servicio Frontend** (React): Landing extendida + Dashboard + Admin
- **1 servicio API** (Node.js): Backend
- **1 servicio OpenClaw** (Docker): Cerebro IA
- **1 servicio PostgreSQL**: Base de datos
- **1 servicio Redis**: Cache

---

## 2. Arquitectura de Servicios EasyPanel

### 2.1 Servicios Necesarios

```
┌─────────────────────────────────────────────────────────────────────┐
│                      EASYPANEL DASHBOARD                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  SERVICIOS:                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Frontend  │  │     API      │  │  OpenClaw    │             │
│  │   (React)   │  │  (Node.js)   │  │   (Docker)   │             │
│  │   :3000     │  │   :3001      │  │    :8080     │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐                               │
│  │  PostgreSQL  │  │    Redis     │                               │
│  │    :5432     │  │    :6379     │                               │
│  │  (volumen)   │  │  (volumen)   │                               │
│  └──────────────┘  └──────────────┘                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Distribución de Puertos

| Servicio | Puerto Interno | Puerto Externo | URL |
|----------|----------------|---------------|-----|
| **Frontend** | 3000 | 80/443 | pivotagents.com |
| **API** | 3001 | 3001 (interno) | api.pivotagents.com |
| **OpenClaw** | 8080 | 8080 (interno) | openclaw.internal |
| **PostgreSQL** | 5432 | - | Solo interno |
| **Redis** | 6379 | - | Solo interno |

### 2.3 Estructura de Archivos en VPS

```
/opt/pivot-agents/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   └── build/
├── api/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   └── .env
├── openclaw/
│   ├── config/
│   └── memory/
├── postgres-data/
├── redis-data/
└── docker-compose.yml
```

---

## 3. Configuración de EasyPanel

### 3.1 Instalación de EasyPanel (si no lo tienes)

```bash
# Conectar a tu VPS por SSH
ssh root@tu-servidor

# Instalar EasyPanel
curl -sSL https://get.easypanel.io | sh

# Acceso al panel
# https://tu-ip:8443
```

### 3.2 Configurar Dominio

**Opción A: Dominio principal (paginapivot.com)**
- Configurar A record para EasyPanel
- SSL automático

**Opción B: Subdominio (pivotagents.paginapivot.com)**
- Crear subdominio en DNS
- Apuntar al servidor

### 3.3 Crear Servicios en EasyPanel

#### Servicio 1: PostgreSQL

```
Name: postgres
Image: postgres:15
Port: 5432
Environment:
  - POSTGRES_DB: pivot_agents
  - POSTGRES_USER: pivot_user
  - POSTGRES_PASSWORD: [generar-contraseña-segura]
Volumes:
  - /opt/pivot-agents/postgres-data:/var/lib/postgresql/data
```

#### Servicio 2: Redis

```
Name: redis
Image: redis:7-alpine
Port: 6379
Volumes:
  - /opt/pivot-agents/redis-data:/data
```

#### Servicio 3: API (Backend)

```
Name: api
Image: paginapivot/api:latest
Port: 3001
Environment:
  - NODE_ENV: production
  - DATABASE_URL: postgresql://pivot_user:[password]@postgres:5432/pivot_agents
  - JWT_SECRET: [generar-secreto]
  - REDIS_URL: redis://redis:6379
  - OPENCLAW_URL: http://openclaw:8080
Build: GitHub repo o upload de archivos
```

#### Servicio 4: OpenClaw

```
Name: openclaw
Image: openclaw/openclaw:latest
Port: 8080
Environment:
  - OPENCLAW_PROVIDER: openai
  - OPENCLAW_API_KEY: [tu-api-key]
  - OPENCLAW_SESSION_MODE: isolated
Volumes:
  - /opt/pivot-agents/openclaw/config:/app/config
  - /opt/pivot-agents/openclaw/memory:/app/memory
```

#### Servicio 5: Frontend

```
Name: frontend
Image: paginapivot/frontend:latest
Port: 3000
Environment:
  - REACT_APP_API_URL: https://api.pivotagents.com
  - REACT_APP_WS_URL: wss://api.pivotagents.com
Build: GitHub repo o upload de archivos
Proxy: Enabled (80/443)
SSL: Enabled (Let's Encrypt)
```

---

## 4. Docker Compose (Alternativa Manual)

### 4.1 Archivo docker-compose.yml

```yaml
version: '3.8'

services:
  # Base de datos
  postgres:
    image: postgres:15
    container_name: pivot-postgres
    environment:
      POSTGRES_DB: pivot_agents
      POSTGRES_USER: pivot_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - ./postgres-data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pivot_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Cache
  redis:
    image: redis:7-alpine
    container_name: pivot-redis
    volumes:
      - ./redis-data:/data
    restart: unless-stopped

  # OpenClaw (Cerebro IA)
  openclaw:
    image: openclaw/openclaw:latest
    container_name: pivot-openclaw
    ports:
      - "8080:8080"
    environment:
      - OPENCLAW_PROVIDER=${OPENCLAW_PROVIDER:-openai}
      - OPENCLAW_API_KEY=${OPENCLAW_API_KEY}
      - OPENCLAW_SESSION_MODE=isolated
    volumes:
      - ./openclaw/config:/app/config
      - ./openclaw/memory:/app/memory
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  # API Backend
  api:
    image: paginapivot/api:latest
    container_name: pivot-api
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://pivot_user:${POSTGRES_PASSWORD}@postgres:5432/pivot_agents
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - OPENCLAW_URL=http://openclaw:8080
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - META_PHONE_NUMBER_ID=${META_PHONE_NUMBER_ID}
      - META_ACCESS_TOKEN=${META_ACCESS_TOKEN}
    depends_on:
      - postgres
      - redis
      - openclaw
    restart: unless-stopped

  # Frontend
  frontend:
    image: paginapivot/frontend:latest
    container_name: pivot-frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=${REACT_APP_API_URL:-http://localhost:3001}
    depends_on:
      - api
    restart: unless-stopped

networks:
  default:
    name: pivot-network
```

### 4.2 Archivo .env

```bash
# Base de datos
POSTGRES_PASSWORD=genera-una-contraseña-segura-aqui

# JWT
JWT_SECRET=genera-una-contraseña-muy-segura-aqui

# OpenClaw
OPENCLAW_PROVIDER=openai
OPENCLAW_API_KEY=sk-tu-api-key-de-openai

# URLs
REACT_APP_API_URL=http://localhost:3001

# Google OAuth
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret

# WhatsApp Meta
META_PHONE_NUMBER_ID=tu-phone-number-id
META_ACCESS_TOKEN=tu-access-token

# Stripe (opcional)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 5. OpenClaw - Repositorio en tu Servidor

### 5.1 Estado Actual

Tienes el repositorio de OpenClaw en:
```
C:\Users\Rcompany\Documents\Paginapivot\openclaw-main
```

### 5.2 Integración con tu Sistema

**Opción A: Usar imagen Docker oficial (Recomendada)**

```bash
# Descargar imagen oficial
docker pull openclaw/openclaw:latest

# Ejecutar
docker run -d \
  --name pivot-openclaw \
  -p 8080:8080 \
  -e OPENCLAW_PROVIDER=openai \
  -e OPENCLAW_API_KEY=tu-api-key \
  -v ./openclaw-data:/app \
  openclaw/openclaw:latest
```

**Opción B: Usar tu repositorio local**

Si necesitas personalización, puedes:
1. Subir tu `openclaw-main` a un repositorio GitHub
2. Conectar ese repo en EasyPanel
3. EasyPanel hará build automáticamente

### 5.3 Configuración de OpenClaw por Usuario

Para que cada usuario tenga su propia sesión:

```javascript
// En tu API, al procesar mensaje:
const sessionId = `usuario_${userId}_${timestamp}`;

await openclawClient.sendMessage({
  session: sessionId,
  message: userMessage,
  context: {
    systemPrompt: user.systemPrompt,
    businessInfo: user.businessInfo,
    googleSheets: user.googleSheetsConfig
  }
});
```

---

## 6. Pasos de Implementación

### Paso 1: Preparar VPS

```bash
# 1. Conectar a tu VPS
ssh root@tu-ip

# 2. Instalar Docker (si no lo tienes)
curl -fsSL https://get.docker.com | sh

# 3. Crear directorio del proyecto
mkdir -p /opt/pivot-agents
cd /opt/pivot-agents

# 4. Clonar/subir archivos del proyecto
# (Lo que te proporcionemos para el backend y frontend)
```

### Paso 2: Configurar EasyPanel

```bash
# 1. Instalar EasyPanel
curl -sSL https://get.easypanel.io | sh

# 2. Acceder al panel
# https://tu-ip:8443

# 3. Crear los servicios según sección 3.3
```

### Paso 3: Subir Código

**Opción A: Upload directo**
- Zip de tus proyectos (frontend y api)
- Subir desde EasyPanel

**Option B: GitHub**
- Conectar repositorio GitHub
- EasyPanel hace build automáticamente

### Paso 4: Configurar DNS

```
# A记录 (IP principal)
pivotagents.com -> tu-ip

# CNAME (subdominios)
api.pivotagents.com -> pivotagents.com
www.pivotagents.com -> pivotagents.com
```

### Paso 5: Verificar

```bash
# Ver contenedores
docker ps

# Ver logs
docker logs pivot-api
docker logs pivot-openclaw

# Probar endpoint
curl http://localhost:3001/health
```

---

## 7. Troubleshooting Común

### 7.1 Problemas de Puerto

```bash
# Ver qué está usando el puerto 80
sudo lsof -i :80

# Matar proceso
sudo kill -9 [PID]
```

### 7.2 Problemas de Docker

```bash
# Ver logs de un servicio
docker logs pivot-postgres

# Reiniciar servicio
docker restart pivot-api

# Ver uso de recursos
docker stats
```

### 7.3 Problemas de Conexión

```bash
# Ver red de contenedores
docker network ls

# Probar conexión entre servicios
docker exec pivot-api ping postgres
```

---

## 8. Checklist de Implementación

### Antes de empezar:

- [ ] Acceso SSH a VPS Hostinger
- [ ] EasyPanel instalado
- [ ] Dominio configurado
- [ ] Puerto 80/443 disponible
- [ ] Credenciales de APIs listas

### Durante implementación:

- [ ] Crear directorio /opt/pivot-agents
- [ ] Configurar PostgreSQL
- [ ] Configurar Redis
- [ ] Instalar OpenClaw
- [ ] Subir código API
- [ ] Subir código Frontend
- [ ] Configurar variables de entorno
- [ ] Verificar funcionamiento

### Después de implementado:

- [ ] SSL funcionando
- [ ] Registro de usuarios funciona
- [ ] Login funciona
- [ ] Dashboard carga
- [ ] Configuración de agente funciona
- [ ] Mensajería funciona

---

## 9. Costos Estimados VPS

### Configuración Recomendada

| Recurso | Especificación | Costo Aproximado |
|---------|----------------|------------------|
| **Básico** | 4GB RAM, 2 CPU, 50GB SSD | $6-8/mes |
| **Recomendado** | 8GB RAM, 4 CPU, 100GB SSD | $15-20/mes |
| **Escalable** | 16GB RAM, 6 CPU, 200GB SSD | $30-40/mes |

### Tu Servidor Actual

```
RAM: 6GB ✅ Suficiente para comenzar
CPU: 2+ cores ✅ Aceptable
Almacenamiento: ¿? ✅ Verifica
```

---

## 10. Resumen: Lo que necesitas hacer

### En tu VPS:

1. **Instalar EasyPanel** (si no lo tienes)
2. **Crear servicios** en EasyPanel:
   - PostgreSQL
   - Redis  
   - OpenClaw
   - API
   - Frontend
3. **Configurar dominio** en DNS
4. **Subir código** del proyecto

### Nosotros te proporcionaremos:

1. **Código del Frontend** (React) - con landing + dashboard + admin
2. **Código de la API** (Node.js) - con todos los endpoints
3. **Dockerfiles** para cada servicio
4. **Instrucciones** detalladas de configuración

---

## 11. Próximo Paso

**Una vez confirmado este plan, procederemos a:**

1. Desarrollar el código del proyecto
2. Crear los archivos necesarios
3. Proporcionarte guías de setup específicas
4. Soporte durante la implementación

¿Confirmas este plan para proceder con el desarrollo?

---

*Documento creado: Abril 2026*
*Versión: 1.0*
