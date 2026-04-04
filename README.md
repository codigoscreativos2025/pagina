# Pivot Soluciones - Plataforma de Agentes IA

Plataforma SaaS para crear agentes de IA personalizados que trabajan 24/7 en WhatsApp.

## Estructura del Proyecto

```
├── index.html          # Landing page (www.pivotsoluciones.com)
├── css/                # Estilos de la landing
├── js/                 # Scripts de la landing
├── app/                # React App (agents.pivotsoluciones.com)
│   ├── src/
│   │   ├── pages/      # Login, Register, Dashboard, Config, Plans, Admin
│   │   ├── contexts/   # AuthContext
│   │   └── services/   # API client
│   ├── package.json
│   └── Dockerfile
├── api/                # Backend Node.js
│   ├── src/
│   │   ├── routes/     # auth, users, agents, plans, webhooks, admin
│   │   ├── services/   # messageQueue, openclawService
│   │   └── middleware/ # auth
│   ├── package.json
│   └── Dockerfile
├── easypanel.landing.yaml
├── easypanel.agents.yaml
├── easypanel.api.yaml
└── ENV_CONFIG.md       # Variables de entorno
```

## Aplicaciones EasyPanel

| App | Dominio | Puerto | Propósito |
|-----|---------|--------|-----------|
| Landing | www.pivotsoluciones.com | 80 | Página principal |
| Agents App | agents.pivotsoluciones.com | 3000 | Dashboard usuarios |
| API | (interno) | 3001 | Backend |

## Landing Page

Página principal con:
- Sección "El Problema" (humano vs IA)
- Procesos automatizados
- **Nueva sección Pivot Agents**
- Servicios (CRM para condos, dentistas, etc.)
- Sistema de referidos
- Demo interactiva del CRM

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Base de datos**: PostgreSQL
- **Cache/Cola**: Redis
- **IA**: OpenClaw (Docker)

## Licencia

© 2025 Pivot Soluciones - Todos los derechos reservados.
