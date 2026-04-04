# Plan de Infraestructura: Lo que Debes Preparar

## Resumen

Este documento lista TODO lo que necesitas preparar en tu VPS de Hostinger para que yo pueda proceder con el desarrollo e implementación de Pivot Agents.

---

## 1. Requisitos del Servidor

### 1.1 Especificaciones Mínimas

| Recurso | Mínimo | Recomendado | Tu Servidor Actual |
|---------|--------|-------------|-------------------|
| **RAM** | 4 GB | 8 GB | 6 GB ✅ |
| **CPU** | 2 cores | 4+ cores | 2+ ✅ |
| **Almacenamiento** | 40 GB SSD | 100 GB SSD | ¿? |
| **SO** | Ubuntu 22.04 | Ubuntu 22.04 LTS | ¿? |

### 1.2 Verificar tu Servidor

Ejecuta estos comandos en tu VPS:

```bash
# Ver RAM
free -h

# Ver CPU
nproc

# Ver almacenamiento
df -h

# Ver SO
cat /etc/os-release
```

---

## 2. EasyPanel

### 2.1 ¿Ya tienes EasyPanel instalado?

```bash
# Verificar si EasyPanel está instalado
curl -s https://get.easypanel.io | head -20

# O verificar si hay algo corriendo en puerto 8443
curl -I https://localhost:8443
```

### 2.2 Si NO tienes EasyPanel

**Instalación:**

```bash
# Conectar a tu VPS
ssh root@tu-servidor

# Instalar EasyPanel
curl -sSL https://get.easypanel.io | sh

# Al finalizar, mostrará:
# - URL de acceso
# - Credenciales temporales
```

**Post-instalación:**
1. Accede a `https://tu-ip:8443`
2. Cambia la contraseña temporal
3. Configura tu dominio

### 2.3 Si YA tienes EasyPanel

1. Accede a tu panel actual
2. Necesitamos crear nuevos servicios
3. Anota las credenciales

---

## 3. Servicios a Crear en EasyPanel

### 3.1 Lista de Servicios

| # | Servicio | Tipo | Puerto | Prioridad |
|---|----------|------|--------|-----------|
| 1 | **PostgreSQL** | Docker | 5432 | Alta |
| 2 | **Redis** | Docker | 6379 | Alta |
| 3 | **OpenClaw** | Docker | 8080 | Alta |
| 4 | **API** | Node.js | 3001 | Alta |
| 5 | **Frontend** | Static/Node.js | 80/443 | Alta |

### 3.2 Orden de Creación

```
1. PostgreSQL (base de datos)
2. Redis (cache)
3. OpenClaw (IA)
4. API (Backend)
5. Frontend (Web)
```

---

## 4. Credenciales Necesarias

### 4.1 APIs Externas

| Servicio | Credencial | ¿Cómo obtenerla? |
|----------|-------------|------------------|
| **Google OAuth** | Client ID | Google Cloud Console |
| **Google OAuth** | Client Secret | Google Cloud Console |
| **OpenAI** | API Key | platform.openai.com |
| **Anthropic** | API Key | console.anthropic.com |
| **Meta WhatsApp** | Phone Number ID | Meta Developer Portal |
| **Meta WhatsApp** | Access Token | Meta Developer Portal |

### 4.2 Generar Secretos

```bash
# Generar contraseña segura
openssl rand -base64 32

# Generar JWT secret
openssl rand -hex 32
```

### 4.3收集 todas las credenciales

Crea un archivo `.env` con todos los valores:

```bash
# Ejemplo de estructura
POSTGRES_PASSWORD=contraseña_segura_1
JWT_SECRET=contraseña_segura_2
OPENCLAW_API_KEY=sk-...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
META_PHONE_NUMBER_ID=...
META_ACCESS_TOKEN=...
```

---

## 5. Dominio y DNS

### 5.1 Configuración DNS

Agrega estos registros en tu proveedor de dominio:

| Tipo | Host | Valor |
|------|------|-------|
| A | @ | tu-ip-del-servidor |
| A | www | tu-ip-del-servidor |
| CNAME | api | tu-dominio-principal |
| CNAME | app | tu-dominio-principal |

### 5.2 SSL

EasyPanel puede generar SSL automático:
- Habilita "SSL" en cada servicio
- Let's Encrypt se configurará automáticamente

---

## 6. Repositorio de OpenClaw

### 6.1 Estado Actual

Tienes el repositorio en:
```
C:\Users\Rcompany\Documents\Paginapivot\openclaw-main
```

### 6.2 Opciones de Uso

**Opción A: Usar Docker Hub (Recomendada)**
```bash
docker pull openclaw/openclaw:latest
```

**Opción B: Usar tu repositorio local**
1. Subir `openclaw-main` a GitHub
2. Conectar en EasyPanel
3. EasyPanel hace build

---

## 7. Checklist de Preparación

### 7.1 Servidor

- [ ] Acceso SSH root al VPS
- [ ] EasyPanel instalado y funcionando
- [ ] Puerto 80/443 disponible
- [ ] Docker instalado

### 7.2 Dominio

- [ ] Dominio registrado
- [ ] DNS configurado
- [ ] SSL habilitado en EasyPanel

### 7.3 Credenciales

- [ ] Google OAuth Client ID
- [ ] Google OAuth Client Secret
- [ ] OpenAI API Key
- [ ] Anthropic API Key (opcional)
- [ ] Meta WhatsApp Phone Number ID
- [ ] Meta WhatsApp Access Token

### 7.4 Base de Datos

- [ ] PostgreSQL configurado
- [ ] Redis configurado
- [ ] Credenciales de acceso

---

## 8. Estructura de Directorios

### 8.1 Estructura Sugerida

```
/opt/pivot-agents/
├── docker-compose.yml
├── .env
├── frontend/
│   └── (código del frontend)
├── api/
│   └── (código del backend)
├── openclaw/
│   ├── config/
│   └── memory/
├── postgres-data/
└── redis-data/
```

### 8.2 Permisos

```bash
# Crear directorio
mkdir -p /opt/pivot-agents

# Permisos
chmod -R 755 /opt/pivot-agents
chown -R root:root /opt/pivot-agents
```

---

## 9. Puertos a Liberar

### 9.1 Puertos del Sistema

| Puerto | Servicio | ¿Usar? |
|--------|----------|--------|
| 22 | SSH | ✅ Siempre |
| 80 | HTTP | ✅ EasyPanel |
| 443 | HTTPS | ✅ EasyPanel |
| 8443 | EasyPanel UI | ✅ (solo admin) |
| 3000 | Frontend | ✅ Solo interno |
| 3001 | API | ✅ Solo interno |
| 8080 | OpenClaw | ✅ Solo interno |
| 5432 | PostgreSQL | ❌ No exponer |
| 6379 | Redis | ❌ No exponer |

### 9.2 Configurar Firewall (Opcional)

```bash
# Si usas ufw
ufw allow 22
ufw allow 80
ufw allow 443
ufw allow 8443
ufw enable
```

---

## 10. Lo que Yo Necesito de Ti

### 10.1 Información Crítica

Para proceder con el desarrollo, necesito que me proporciones:

1. **Acceso al VPS**
   - IP del servidor
   - Credenciales SSH

2. **Credenciales de EasyPanel**
   - URL del panel
   - Usuario y contraseña

3. **Dominio**
   - Dominio principal a usar
   - ¿Tienes SSL configurado?

4. **APIs**
   - OpenAI API Key (para pruebas)
   - ¿Tienes cuenta de Meta Developer?

### 10.2的形式 de Entrega

Puedes darme esta información de forma segura. Una vez que tenga acceso, podré:

1. Configurar los servicios en EasyPanel
2. Subir y configurar el código
3. Verificar que todo funcione
4. Darte acceso al sistema completo

---

## 11. Resumen: Tu Trabajo

### Lo que DEBES hacer:

```
1. ✅ Verificar specs de tu servidor (6GB RAM mínimo)
2. ✅ Instalar EasyPanel (si no lo tienes)
3. ✅ Configurar dominio en DNS
4. ✅ Obtener credenciales de APIs necesarias
5. ✅ Darme acceso al VPS o EasyPanel
```

### Lo que YO haré:

```
1. Crear servicios en EasyPanel
2. Desarrollar el código completo
3. Configurar Docker y contenedores
4. Integrar todo el sistema
5. Verificar funcionamiento
```

---

## 12. Contacto para Acceso

### Opción 1: Acceso SSH directo

Proporciona:
- IP del servidor
- Usuario (root)
- Contraseña o clave SSH

### Opción 2: Acceso solo a EasyPanel

Proporciona:
- URL de EasyPanel
- Usuario administrador
- Contraseña

### Opción 3: Yo te guío paso a paso

Si prefieres hacerlo tú mismo, te doy instrucciones detalladas para cada paso.

---

## 13. Próximo Paso

**Una vez que tengas todo preparado, avísame y comenzamos:**

1. ✅ Reviso tu configuración
2. ✅ Subo el código
3. ✅ Configuro servicios
4. ✅ Verifico funcionamiento
5. ✅ Te entrego el sistema listo

¿Tienes alguna duda sobre lo que necesitas preparar?

---

*Documento creado: Abril 2026*
*Versión: 1.0*
