# 🗂️ Crear tabla de Sesiones en Supabase

## ⚠️ IMPORTANTE
Sin las tablas `sesiones_usuarios` y `notificaciones`, **el registro de sesiones NO funcionará**.

---

## 📋 Pasos para crear las tablas:

### 1️⃣ Abre la consola SQL de Supabase
- Ve a: **Supabase Project > SQL Editor**
- Haz clic en **`+ New Query`** (esquina superior derecha)

### 2️⃣ Copia y pega este código SQL:

```sql
-- ════════════════════════════════════════════
-- CREAR TABLA: SESIONES DE USUARIOS
-- ════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS sesiones_usuarios (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER,
    email VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    fecha_ingreso TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_salida TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_sesiones_usuarios_email ON sesiones_usuarios(email);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuarios_fecha_ingreso ON sesiones_usuarios(fecha_ingreso);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuarios_usuario_id ON sesiones_usuarios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuarios_salida_null ON sesiones_usuarios(fecha_salida) WHERE fecha_salida IS NULL;

-- ════════════════════════════════════════════
-- CREAR TABLA: NOTIFICACIONES
-- ════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usuario_email VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON notificaciones(tipo);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_fecha_creacion ON notificaciones(fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_email ON notificaciones(usuario_email);

-- ════════════════════════════════════════════
-- AGREGAR COLUMNAS A HISTORIAL (si faltan)
-- ════════════════════════════════════════════

ALTER TABLE historial_cambios ADD COLUMN IF NOT EXISTS usuario_email VARCHAR(255);
ALTER TABLE historial_cambios ADD COLUMN IF NOT EXISTS usuario_nombre VARCHAR(255);

-- ════════════════════════════════════════════
-- LISTO! Ahora presiona "Run"
-- ════════════════════════════════════════════
```

### 3️⃣ Presiona el botón **`Run`** (esquina inferior derecha)

### 4️⃣ Verifica que se crearon las tablas:
En **Supabase > Table Editor**, deberías ver:
- ✅ `sesiones_usuarios`
- ✅ `notificaciones`
- ✅ `historial_cambios` (con columnas `usuario_email` y `usuario_nombre`)

---

## ✅ Validar que funciona:

### En el **fronted** (app web):
1. **Inicia sesión** con un usuario
2. Abre el **Panel Admin** (si eres admin)
3. Ve a la pestaña **"Sesiones de Usuarios"**
4. Deberías ver tu sesión con:
   - 👤 Tu nombre
   - 📧 Tu email
   - ⏰ Hora de ingreso
   - ✅ Estado: "Activa" (sin fecha de salida)

### En **Supabase (SQL Editor)**:
Ejecuta esta query para verificar:
```sql
SELECT id, email, nombre, fecha_ingreso, fecha_salida FROM sesiones_usuarios ORDER BY fecha_ingreso DESC LIMIT 5;
```

Deberías ver registros como:
```
id | email                 | nombre            | fecha_ingreso         | fecha_salida
---|------------------------|------------------|------------------------|----------
 1 | usuario@sena.edu.co  | Juan Pérez       | 2026-03-16 12:30:45   | (null) ← ACTIVA
 2 | admin@sena.edu.co    | Admin SENA       | 2026-03-16 11:00:20   | 2026-03-16 13:45:30
```

---

## 🔧 Solucionar problemas:

### ❌ "No hay sesiones registradas aún"
**Causas y soluciones:**

1. **La tabla NO existe en Supabase**
   - Ejecuta el SQL anterior en la consola SQL de Supabase
   - Verifica en **Table Editor** que aparezca `sesiones_usuarios`

2. **El endpoint devuelve error 500**
   - Abre la **consola del navegador** (F12 > Console)
   - Busca mensajes en rojo sobre "Error registrando sesión"
   - Copia el error y revisa si es error de tabla

3. **La sesión se registra pero no aparece en el panel**
   - Asegúrate de ser **ADMIN** (solo admins ven todas las sesiones)
   - Recarga la página (F5)
   - Abre nuevamente el panel de "Sesiones de Usuarios"

---

## 📊 Diferencia importante:

| Feature | Historial de Cambios | Sesiones de Usuarios |
|---------|----------------------|----------------------|
| **Qué registra** | Cambios en activos (crear, editar, eliminar) | Logins y logouts |
| **Acceso** | Solo admin | Solo admin |
| **Datos importantes** | Placa del activo, qué cambió | Hora de entrada/salida, IP |
| **Quién lo ve** | Panel Admin > Historial | Panel Admin > Sesiones |

---

## ✨ Resumen rápido:
1. ✅ Abre Supabase > SQL Editor
2. ✅ Copia el SQL anterior
3. ✅ Presiona "Run"
4. ✅ Inicia sesión en el sistema 
5. ✅ Panel Admin > Sesiones de Usuarios
6. ✅ ¡Verás tu sesión registrada!

