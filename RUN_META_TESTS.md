# Meta App Review Tests - Ejecución Directa

## Opción 1: Página HTML Simple

Abre este archivo en tu navegador:
```
frontend/public/meta-review-tests.html
```

O accede desde: `https://agents.pivotsoluciones.com/meta-review-tests.html` (si ya subiste el archivo)

**Instrucciones:**
1. Ingresa tu token de autenticación
2. Haz clic en "Verificar Estado Actual"
3. Haz clic en "Ejecutar" en cada test pendiente

---

## Opción 2: PowerShell Script (Windows)

Crea un archivo `run-meta-tests.ps1` y ejecútalo:

```powershell
# Configuración
$baseUrl = "https://agents.pivotsoluciones.com/api"
$token = "TU_TOKEN_AQUI"

# Headers
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 1. public_profile
Write-Host "📝 Ejecutando: public_profile" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/integrations/test-public-profile" -Method Post -Headers $headers
    Write-Host "✅ SUCCESS: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. pages_show_list
Write-Host "`n📝 Ejecutando: pages_show_list" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/integrations/test-pages-show-list" -Method Post -Headers $headers
    Write-Host "✅ SUCCESS: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. pages_utility_messaging
Write-Host "`n📝 Ejecutando: pages_utility_messaging" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/integrations/test-utility-message" -Method Post -Headers $headers
    Write-Host "✅ SUCCESS: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. instagram_manage_messages
Write-Host "`n📝 Ejecutando: instagram_manage_messages" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/integrations/test-instagram/manage_messages" -Method Post -Headers $headers
    Write-Host "✅ SUCCESS: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ Todos los tests completados!" -ForegroundColor Green
```

---

## Opción 3: cURL (Linux/Mac/WSL)

```bash
#!/bin/bash

BASE_URL="https://agents.pivotsoluciones.com/api"
TOKEN="TU_TOKEN_AQUI"

HEADERS="Authorization: Bearer $TOKEN"

echo "📝 Ejecutando: public_profile"
curl -X POST "$BASE_URL/integrations/test-public-profile" -H "$HEADERS"
echo ""

echo "📝 Ejecutando: pages_show_list"
curl -X POST "$BASE_URL/integrations/test-pages-show-list" -H "$HEADERS"
echo ""

echo "📝 Ejecutando: pages_utility_messaging"
curl -X POST "$BASE_URL/integrations/test-utility-message" -H "$HEADERS"
echo ""

echo "📝 Ejecutando: instagram_manage_messages"
curl -X POST "$BASE_URL/integrations/test-instagram/manage_messages" -H "$HEADERS"
echo ""
```

---

## Obtener tu Token

Si no tienes tu token, ejecuta esto primero:

```powershell
# PowerShell
$body = @{
    email = "tu@email.com"
    password = "tu-password"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://agents.pivotsoluciones.com/api/auth/login" -Method Post -ContentType "application/json" -Body $body
$token = $response.token
Write-Host "Tu token: $token"
```

O en bash:
```bash
curl -X POST https://agents.pivotsoluciones.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"tu-password"}'
```

---

## Ver Estado

```bash
# cURL
curl https://agents.pivotsoluciones.com/api/integrations/meta-review-status \
  -H "Authorization: Bearer TU_TOKEN"
```

```powershell
# PowerShell
Invoke-RestMethod -Uri "https://agents.pivotsoluciones.com/api/integrations/meta-review-status" -Headers @{ Authorization = "Bearer $token" }
```
