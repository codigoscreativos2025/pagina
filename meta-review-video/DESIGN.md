# Design System - Pivot.AI

## Overview

Pivot.AI es una plataforma SaaS de automatización de marketing con AI agents. La interfaz tiene un diseño oscuro y moderno estilo "dark glassmorphism" con acentos en azul corporativo. El layout utiliza sidebar fija, cards de métricas, tablas de datos, y modales de conexión. La personalidad es técnica, profesional y orientada a negocios.

## Colors

- **Primary (Brand 600)**: #2563EB — Botones principales, links, acentos
- **Primary (Brand 500)**: #3B82F6 — Hover states, secundary buttons
- **Primary (Brand 400)**: #60A5FA — Highlights, iconos activos
- **Accent (Cyan)**: #06B6D4 — AI elements, badges
- **Surface (Dark)**: #0F172A — Background principal (slate-900)
- **Surface (Card)**: #1E293B — Cards, paneles (slate-800)
- **Surface (Elevated)**: #334155 — Elevated surfaces (slate-700)
- **Text Primary**: #F8FAFC — Texto principal
- **Text Secondary**: #94A3B8 — Texto muted
- **Border**: #475569 — Bordes (slate-600)
- **Success**: #22C55E — Estados exitosos
- **Error**: #EF4444 — Estados de error
- **Warning**: #F59E0B — Estados de warning

## Typography

- **Font Family**: Inter (400, 500, 600, 700)
- **Heading 1**: 32-48px, font-weight 700
- **Heading 2**: 24-32px, font-weight 600
- **Heading 3**: 18-24px, font-weight 600
- **Body**: 14-16px, font-weight 400
- **Labels**: 12-14px, font-weight 500
- **Monospace**: Para código

## Elevation

- **Cards**: background #1E293B, border-radius 12-16px, border 1px solid #475569/30
- **Glassmorphism**: backdrop-blur en modales, bg white/5 a white/10
- **Shadows**: Minimalos, usar borders en lugar de shadows
- **Hover**: translateY(-2px), border opacity increase
- **Focus**: ring-2 ring-brand-500/50

## Components

- **Login Form**: Dark glass card, email/password inputs, Facebook + Google buttons
- **Sidebar**: Fixed left, 240-280px, navigation items con icons
- **Dashboard Cards**: Métricas con iconos, valores grandes, tendencias
- **Data Tables**: Filas alternating, hover highlight, pagination
- **Integration Cards**: Logo platform, status badge, connect/disconnect button
- **Modal**: Centered, dark glass, close button
- **Buttons**: Primary (brand), Secondary (outline), Danger (red)
- **Chat Panel**: Bubbles, timestamp, input field
- **Metric Counter**: Número grande, label, trend indicator

## Do's and Don'ts

### Do's

- Usar gradientes sutiles en backgrounds (from-slate-900 via-slate-800 to-slate-900)
- Mantener consistencia con tokens Tailwind de brand-X
- Usar border-radius uniformes (8px buttons, 12px cards, 16px modals)
- Incluir iconos de Meta/Facebook/Instagram en flujos de integración
- Mostrar estados de conexión (connected/disconnected)

### Don'ts

- No usar backgrounds brightness
- No usar shadows prominentes
- No mezclar familias de fuentes
- No usar colores fuera de la paleta definida