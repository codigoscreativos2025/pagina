# 🚀 EJECUTAR AHORA - Meta App Review Tests

## Paso 1: Reiniciar Backend (EN EASYPANEL)

1. Ve a tu panel de EasyPanel
2. Selecciona `pivot-backend`
3. Haz clic en **Restart**

**Espera 10 segundos** a que el backend se reinicie completamente.

---

## Paso 2: Ejecutar Tests desde el Frontend

1. Ve a: `https://agents.pivotsoluciones.com/integrations`
2. Inicia sesión
3. Baja hasta **"📋 Meta App Review - Estado de Tests"**

Verás esta tabla:

```
┌─────────────────────────────────────────────────────┐
│ 📋 Meta App Review - Estado de Tests       0/7      │
├─────────────────────────────────────────────────────┤
│ 📘 public_profile              ⏳ Pendiente  [Ejecutar] │
│ 📘 pages_show_list           ⏳ Pendiente  [Ejecutar] │
│ 📘 pages_utility_messaging   ⏳ Pendiente  [Ejecutar] │
│ 📘 instagram_manage_messages ⏳ Pendiente  [Ejecutar] │
│ 📘 instagram_manage_comments ⏳ Pendiente  [Ejecutar] │
│ 📘 instagram_manage_insights ⏳ Pendiente  [Ejecutar] │
│ 📘 instagram_content_publish ⏳ Pendiente  [Ejecutar] │
└─────────────────────────────────────────────────────┘
```

4. Haz clic en **"Ejecutar"** en cada test
5. Espera a que cada uno diga **"✅ Ejecutado"**

---

## Paso 3: Verificar en Meta Developers

1. Ve a https://developers.facebook.com/
2. Selecciona tu app
3. **App Review** → **Permissions**
4. Verifica que cada permiso diga **"Used"**

---

## ⚠️ Si un Test Falla

### "No Facebook leads found"
- Alguien debe enviar un mensaje a tu página de Facebook primero
- Luego vuelve a ejecutar el test

### "No Instagram users found"
- Alguien debe enviar un DM a tu Instagram primero
- Luego vuelve a ejecutar el test

### "Facebook not connected"
- Conecta Facebook en la sección de Integraciones primero

---

## ✅ Cuando Todos los Tests Estén Completados

1. Toma capturas de pantalla
2. Graba los videos requeridos (ver `REVISION_META_Y_GUION.md`)
3. Envía tu app para revisión en Meta

---

**¡Listo! Los 4 permisos requeridos quedarán verificados.**
