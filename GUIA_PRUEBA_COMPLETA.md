# 🚀 Guía de Implementación y Prueba - Sistema Historial y Notificaciones

## 📌 Paso 1: Crear las Tablas en Supabase

1. **Abre Supabase** → Tu proyecto
2. **Ir a SQL Editor**
3. **Copiar y pegar todo el contenido de `setup_tablas_supabase.sql`**
4. **Ejecutar el script**
5. **Verificar que aparezcan las tablas:**  
   - `sesiones_usuarios`
   - `notificaciones`

---

## 🔧 Paso 2: Desplegar en Render

1. **Haz git push de todos los cambios:**
   ```bash
   git add .
   git commit -m "Agregar sistema de historial, sesiones y notificaciones"
   git push origin main
   ```

2. **Render se desplegará automáticamente**
   - Espera 2-3 minutos para que se compile

3. **Verifica en:** `https://sena-inventario-sistema.onrender.com`

---

## ✅ Paso 3: Prueba el Sistema

### 3.1 Probar **Panel de Notificaciones (Header)**

1. **Abre la app** en navegador
2. **Inicia sesión como admin**
3. **Mira el ícono de campana en el header**
   - Si hay notificaciones, verás un badge rojo con el número
   - Haz clic en la campana → se abre un panel emergente
   - Este panel muestra las últimas 10 notificaciones

### 3.2 Probar **Panel Admin Mejorado**

1. **Haz clic en el ícono de escudo (admin)**
2. **Se abre "Panel Admin — Invitar Instructores"**
3. **Ahora veras 4 TABS en la parte inferior:**

#### **TAB 1: Invitaciones** ✅
- (Funcionalidad previa)
- Invitar nuevos instructores
- Gestionar usuarios (Activar/Desactivar/Eliminar/Reenviar)

#### **TAB 2: Historial de Cambios** 🆕
1. Haz clic en tab "Historial de Cambios"
2. Verás una tabla con:
   - **Placa** del activo
   - **Usuario** que lo modificó
   - **Acción** (creado, actualizado, eliminado)
   - **Descripción** del cambio
   - **Fecha y Hora** exacta
3. Para **eliminar TODO el historial:**
   - Haz clic en botón rojo "Eliminar Todo el Historial"
   - Confirma 2 veces (está protegido contra eliminación accidental)
   - Se eliminarán todos los registros

#### **TAB 3: Sesiones de Usuarios** 🆕
1. Haz clic en tab "Sesiones de Usuarios"
2. Verás una tabla con:
   - **Nombre** del usuario
   - **Correo** (email)
   - **Fecha/Hora Ingreso** (cuándo entró)
   - **Fecha/Hora Salida** (cuándo salió, o "Activa" si está logueado)
   - **Duración** en horas
   - **IP** de donde se conectó
3. Para **limpiar sesiones antiguas:**
   - Haz clic en botón naranja "Limpiar Sesiones Antiguas (>30 días)"
   - Se eliminarán sesiones mayores a 30 días
   - Las sesiones activas NO se tocarán

#### **TAB 4: Notificaciones** 🆕
1. Haz clic en tab "Notificaciones"
2. Verás una tabla con:
   - **Tipo** (sesion, cambio, alerta, info) - con color diferente
   - **Título** de la notificación
   - **Mensaje** (previa)
   - **Fecha/Hora** de creación
   - **Estado** (✓ Leída / ○ No leída)

---

## 📊 Dónde Aparecen los Datos

### Historial de Cambios
- **Se registra automáticamente** cuando haces:
  - Crear un nuevo activo
  - Editar un activo  
  - Eliminar un activo
- Cada cambio queda registrado con usuario, fecha y hora exacta

### Sesiones de Usuarios
- **Visible en:** Admin → Tab "Sesiones de Usuarios"
- **Se registra cuando:**
  - Un usuario inicia sesión (futuro: integrar en hacerLogin())
  - Un usuario cierra sesión (futuro: integrar en cerrarSesion())
  - Por ahora, puedes crear sesiones de ejemplo desde Supabase SQL

### Notificaciones
- **Visible en:** 
  - Header (badge en la campanita)
  - Admin → Tab "Notificaciones"
- **Se crean mediante:** 
  - Endpoint POST `/api/admin/notificaciones/crear` (solo admin)
  - Debes crearlas manualmente o automatizarlas después

---

## 🔒 Seguridad

✅ **Protegido con requiere_admin:**
- Solo el admin puede ver historial completo
- Solo el admin puede ver sesiones de todos
- Solo el admin puede eliminar datos
- Todos los cambios llevan usuario y timestamp

✅ **Doble confirmación en acciones destructivas:**
- Eliminar todo historial → 2 confirmaciones
- Limpiar sesiones antiguas → 1 confirmación

---

## 🐛 Si Algo No Funciona

### "Error cargando invitaciones / historial / etc"
1. Abre **DevTools** (F12 → Console)
2. Busca mensajes de error en rojo
3. Verifica que las tablas existan en Supabase
4. Verifica que el token de admin sea válido

### "No veo el badge de notificaciones"
1. Asegúrate de estar logueado como admin
2. Abre DevTools → Network
3. Busca la llamada a `/api/admin/notificaciones`
4. Verifica que devuelva datos

### "No se ve el botón de eliminar historial"
1. Verifica que estés en el tab "Historial de Cambios"
2. Abre DevTools → Console y busca errores

### "Las sesiones no se registran"
- Por ahora es manual, necesita integración en auth.js
- Puedes crear sesiones de ejemplo en Supabase SQL

---

## 📱 Ubicación de Elementos

```
┌─────────────────────────────────────────────┐
│           HEADER (Siempre visible)          │
│  Logo │ Búsqueda │ ... │ 🔔 Campanita 🔐  │
│                        └─ Panel Notif.      │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│     SECCIÓN BÚSQUEDA Y FILTROS (Index)      │
│  Placa │ Cédula │ Activo │ Ubicación       │
│  [Buscar] [Limpiar] [Exportar] [+ Nuevo]   │
│  ❌ REMOVIDO: Botón "Historial"            │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│     TABLA DE INVENTARIO (como antes)        │
│  Mostrando todos los activos                │
│  Botones: Ver │ Editar │ Eliminar          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│        MODAL ADMIN (Al hacer clic en 🔐)   │
│  ┌─────────────────────────────────────┐   │
│  │ ▶️ INVITACIONES (default)           │   │
│  │ ▶️ HISTORIAL DE CAMBIOS (nuevo)     │   │
│  │ ▶️ SESIONES DE USUARIOS (nuevo)     │   │
│  │ ▶️ NOTIFICACIONES (nuevo)           │   │
│  └─────────────────────────────────────┘   │
│  [Contenido del tab seleccionado]          │
└─────────────────────────────────────────────┘
```

---

## 🎯 Resumen de lo Implementado

| Componente | Estado | Ubicación |
|-----------|--------|-----------|
| **Historial removido del index** | ✅ Hecho | N/A |
| **Historial en admin** | ✅ Hecho | Admin → Tab "Historial" |
| **Sesiones de usuarios** | ✅ Hecho | Admin → Tab "Sesiones" |
| **Notificaciones header** | ✅ Hecho | Header → Campanita |
| **Notificaciones admin** | ✅ Hecho | Admin → Tab "Notificaciones" |
| **Eliminar historial** | ✅ Hecho | Admin → Historial (botón rojo) |
| **Limpiar sesiones** | ✅ Hecho | Admin → Sesiones (botón naranja) |
| **Badge dinámico** | ✅ Hecho | Actualiza cada 30 segundos |
| **Protección admin** | ✅ Hecho | Todos los endpoints protegidos |

---

## 🚀 Próximos Pasos (Opcionales)

1. **Integrar registro automático de sesiones**
   - En `hacerLogin()`: llamar a `POST /api/admin/sesion/inicio`
   - En `cerrarSesion()`: llamar a `POST /api/admin/sesion/cierre`

2. **Crear notificaciones automáticas**
   - Cuando se crea/edita/elimina un activo
   - Cuando un usuario inicia/cierra sesión
   - Cuando se realiza una acción importante

3. **Agregar filtros**
   - Filtrar historial por fecha/usuario
   - Filtrar sesiones por usuario/fecha
   - Filtrar notificaciones por tipo

4. **Exportar datos**
   - Descargar historial a CSV/Excel
   - Descargar reporte de sesiones

---

## 📞 Contacto y Ayuda

Si algo no funciona:
1. Verifica que ejecutaste el setup_tablas_supabase.sql
2. Revisa la consola del navegador (F12 → Console)
3. Verifica los logs de Render (https://dashboard.render.com)
4. Abre un terminal y ejecuta:
   ```bash
   git log --oneline -n 5  # Ver últimos commits
   git status              # Ver cambios pendientes
   ```

---

## ✨ ¡Listo!

Tu sistema ahora tiene:
- ✅ Historial completo y detallado
- ✅ Registro de sesiones de usuarios
- ✅ Sistema de notificaciones
- ✅ Panel admin mejorado con tabs
- ✅ Protección y confirmaciones
- ✅ Interfaz responsiva y moderna

**¡Disfruta tu nuevo sistema! 🎉**
