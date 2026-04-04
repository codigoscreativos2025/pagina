# ============================================
# CONFIGURACIÓN DE VARIABLES DE ENTORNO
# ============================================
# Estas variables se configuran en EasyPanel
# en la sección "Environment Variables"
# de cada servicio.
#
# NO subas este archivo con valores reales
# ============================================

# ============================================
# API Backend - pivot-agents-api
# ============================================

# URL de la base de datos PostgreSQL (proporcionada por EasyPanel)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/pivotagents

# URL de Redis (proporcionada por EasyPanel)
REDIS_URL=redis://redis:6379

# Secret para JWT (genera una cadena aleatoria segura)
JWT_SECRET=change-this-to-a-secure-random-string-at-least-32-chars

# URL de OpenClaw (tu servicio ya desplegado en EasyPanel)
OPENCLAW_URL=http://openclaw:18789

# Token para verificar webhooks de WhatsApp
WEBHOOK_VERIFY_TOKEN=pivot_verify_token

# Tu API key de OpenAI (solo tú la tienes)
OPENAI_API_KEY=sk-your-openai-api-key-here

# ============================================
# OpenClaw (si lo desplegas desde aquí)
# ============================================
OPENAI_API_KEY=sk-your-openai-api-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key (optional)
