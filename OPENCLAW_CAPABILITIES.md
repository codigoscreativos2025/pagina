# 🧠 OpenClaw AI - Capacidades y Herramientas

## API Utilizada

| Método | Endpoint | Uso actual |
|--------|----------|------------|
| `POST` | `/v1/chat/completions` | Chat principal (OpenAI-compatible) |
| `DELETE` | `/api/session/{sessionId}` | Limpiar sesión |
| `GET` | `/api/session/{sessionId}` | Info de sesión |
| `GET` | `/health` | Health check |

## Formato de Request Actual

```json
{
  "model": "main",
  "user": "user_{userId}_session",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ]
}
```

## NO se usa actualmente:

| Feature | Estado | Potencial |
|---------|--------|-----------|
| `tools` / function calling | ❌ No implementado | Permitiría acciones estructuradas |
| `tool_choice` | ❌ No implementado | Forzar uso de herramienta |
| `stream` | ❌ No implementado | Respuesta en tiempo real |
| `temperature` / `top_p` | ❌ No implementado | Control de creatividad |
| Vision / multimodal | ❌ No implementado | Entender imágenes |
| `response_format` (JSON) | ❌ No implementado | Respuestas estructuradas |

## System Prompt Inyectado

El system prompt se construye concatenando:

1. **`agent.system_prompt`** - Texto base del agente
2. **`agent.business_info`** - Info del negocio (JSON)
3. **`agent.google_sheets_config`** - Config de Google Sheets
4. **`contextExtras.mediaContext`** - Contexto multimedia (NUEVO)
5. **`contextExtras.templateContext`** - Templates WhatsApp disponibles
6. **`agent.ai_config.tools`** - Herramientas configuradas (NUEVO)
7. **`agent.permissions`** - Permisos activos (NUEVO)

## Pseudo-Tool Calling (Templates)

El AI puede "disparar" templates con texto especial:
```
SEND_TEMPLATE:nombre_template
```

El backend parsea y elimina este comando de la respuesta visible.

## Herramientas Configurables (Frontend)

| ID | Label | Tipo |
|----|-------|------|
| `google_sheets` | Google Sheets | File picker |
| `google_docs` | Google Docs | File picker |
| `google_calendar` | Google Calendar | Resource |
| `call_agent` | Llamar otros agentes | Agent selector |

## Permisos de Canal

| ID | Canal | Acción |
|----|-------|--------|
| `whatsapp_reply` | WhatsApp | Enviar respuestas |
| `instagram_reply` | Instagram | Enviar respuestas |
| `facebook_reply` | Facebook | Enviar respuestas |
| `tiktok_reply` | TikTok | Enviar respuestas |
| `telegram_notify` | Telegram | Notificaciones |
| `send_email` | Email | Enviar correos |

## Procesamiento Multimedia

| Tipo | Cómo llega al AI |
|------|------------------|
| Texto | Directo |
| Audio | Transcripción Whisper → texto |
| Imagen | `[IMAGE] filename - caption` |
| Video | `[VIDEO] filename - caption` |
| Documento legible | `[DOCUMENTO: filename] contenido extraído` |
| Documento no legible | `[DOCUMENTO: filename] - pedir descripción` |
| Sticker | `[STICKER]` (sin procesar) |

## Acciones Recomendadas para Implementar

Basado en las capacidades de OpenClaw (API OpenAI-compatible), estas son las herramientas que se pueden agregar:

### 1. Function Calling (tools array)
```json
{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "search_knowledge_base",
        "description": "Buscar en la base de conocimiento del negocio",
        "parameters": { "type": "object", "properties": { "query": { "type": "string" } } }
      }
    }
  ]
}
```

### 2. Respuesta estructurada (JSON mode)
```json
{
  "response_format": { "type": "json_object" }
}
```

### 3. Control de creatividad
```json
{
  "temperature": 0.7,
  "top_p": 0.9
}
```

### 4. Historia de conversación (multi-turn)
```json
{
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "..." }
  ]
}
```

### 5. Streaming (respuesta en tiempo real)
```json
{
  "stream": true
}
```

---

## 🔒 Blindaje del Agente (Scope Locking)

Para evitar que el agente se salga de su rol, el system prompt incluye:

```
[Agent Capabilities & Permissions]
Configured Tools: ...
Active Permissions: ...
Instructions: Use these capabilities ONLY within your role. 
Never respond about topics outside your defined scope.
```

Cada agente debe tener su `system_prompt` con instrucciones claras sobre:
- Su rol específico
- Lo que PUEDE hacer
- Lo que NO PUEDE hacer
- Cómo manejar preguntas fuera de scope

---

## 🎯 Próximos pasos sugeridos

| Prioridad | Feature | Descripción |
|-----------|---------|-------------|
| Alta | `mediaContext` en webhooks | Enviar descripción de imagen/audio al AI |
| Alta | Historial multi-turn | Enviar últimos N mensajes al AI para contexto |
| Media | Function calling | Tools estructurados con JSON Schema |
| Media | JSON mode | Respuestas estructuradas para acciones |
| Baja | Streaming | Respuesta en tiempo real (más complejo) |
| Baja | Vision | Si OpenClaw soporta GPT-4V |
