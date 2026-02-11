# 📦 SENA Inventario Sistema

**Sistema de gestión de inventario para SENA** - Aplicación web full-stack con almacenamiento permanente en la nube, desarrollada con FastAPI, HTML/CSS/JavaScript vanilla, PostgreSQL, Supabase y Cloudinary.

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green?logo=fastapi)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-f7df1e?logo=javascript)
![HTML5](https://img.shields.io/badge/HTML5-Latest-e34c26?logo=html5)
![CSS3](https://img.shields.io/badge/CSS3-Latest-1572b6?logo=css3)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?logo=postgresql)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Cloud%20Storage-blue)
![Render](https://img.shields.io/badge/Render-Deploy-46E3B7)

---

## 📋 Tabla de Contenidos

- [Características](#características)
- [Requisitos Previos](#requisitos-previos)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación y Configuración](#instalación-y-configuración)
- [Configuración de Servicios Externos](#configuración-de-servicios-externos)
- [Uso Local](#uso-local)
- [Despliegue en Render](#despliegue-en-render)
- [API Endpoints](#api-endpoints)
- [Solución de Problemas](#solución-de-problemas)
- [Tecnologías](#tecnologías)
- [Contribuidores](#contribuidores)

---

## ✨ Características

### ✅ Gestión de Activos
- ➕ Crear nuevos activos con imágenes
- 📝 Editar información de activos existentes
- 🗑️ Eliminar activos con historial
- 🔍 Búsqueda por placa, responsable, cédula y ubicación
- 📊 Filtrados y paginación

### 🖼️ Almacenamiento de Imágenes
- ☁️ **Almacenamiento en Cloudinary** (permanente y confiable)
- 🔒 URLs seguras y encriptadas
- 📱 Optimización automática de imágenes
- ♾️ Espacio ilimitado en la nube

### 📋 Historial de Cambios
- 📅 Registro de todas las acciones (crear, actualizar, eliminar)
- 👤 Trazabilidad de cambios por usuario
- 🕐 Timestamps automáticos
- 📊 Consulta de historial general y por activo

### 💾 Exportación de Datos
- 📥 Exportar a Excel (XLSX)
- 📐 Incluye todas las URLs de imágenes
- 📊 Datos formateados y listos para análisis

### 🔐 Base de Datos
- 🗄️ PostgreSQL en Supabase
- 🛡️ Conexión encriptada
- 📈 Escalable y confiable

### 🎨 Interfaz Web
- 📱 Diseño responsivo (HTML/CSS)
- ⚡ JavaScript vanilla (sin dependencias externas)
- 🌐 Compatible con navegadores modernos

---

## 🖥️ Requisitos Previos

### Sistema
- **Python 3.10+** (para backend)
- **Navegador moderno** (Chrome, Firefox, Safari, Edge)
- **Git**
- **Visual Studio Code** (recomendado)

### Cuentas Externas
- 🔑 **GitHub** (para clonar el proyecto)
- 🐘 **Supabase** (base de datos PostgreSQL)
- ☁️ **Cloudinary** (almacenamiento de imágenes)
- 🚀 **Render** (despliegue)

---

## 📁 Estructura del Proyecto

```
sena-inventario-sistema/
│
├── backend/                          # 🔧 FastAPI Backend
│   ├── app/
│   │   ├── main.py                  # Punto de entrada principal
│   │   ├── models/
│   │   │   ├── activo.py            # Modelo de datos - Activo
│   │   │   └── historial.py         # Modelo de datos - Historial de cambios
│   │   ├── routes/
│   │   │   ├── activos.py           # Rutas para gestionar activos
│   │   │   └── inventario.py        # Rutas con Cloudinary integration
│   │   ├── database/
│   │   │   └── database.py          # Configuración de conexión a BD
│   │   └── core/
│   │       └── config.py            # Configuración global
│   ├── requirements.txt              # Dependencias Python
│   ├── .env.example                  # Ejemplo de variables de entorno
│   └── uploads/                      # Carpeta local (deprecada con Cloudinary)
│
├── frontend/                         # 💻 HTML/CSS/JavaScript Frontend
│   ├── static/
│   │   ├── css/
│   │   │   └── styles.css           # Estilos globales
│   │   ├── js/
│   │   │   ├── main.js              # Script principal
│   │   │   ├── api.js               # Llamadas al API
│   │   │   ├── activos.js           # Lógica de activos
│   │   │   ├── historial.js         # Lógica de historial
│   │   │   └── utils.js             # Funciones utilitarias
│   │   └── images/
│   │       └── [assets]             # Imágenes locales
│   └── index.html                    # Página principal
│
├── .gitignore                        # Archivos a ignorar en Git
└── README.md                         # Este archivo

```

---

## 🚀 Instalación y Configuración

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/inventariosennova/sena-inventario-sistema.git
cd sena-inventario-sistema
```

### Paso 2: Configurar Backend

#### 2.1 Crear y activar ambiente virtual

**Windows (PowerShell):**
```bash
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### 2.2 Instalar dependencias

```bash
cd backend
pip install -r requirements.txt
```

**Dependencias principales:**
- `fastapi==0.104.1` - Framework web
- `sqlalchemy==2.0.23` - ORM para base de datos
- `psycopg2-binary==2.9.9` - Driver PostgreSQL
- `python-dotenv==1.0.0` - Manejo de variables de entorno
- `cloudinary==1.44.1` - Almacenamiento de imágenes
- `fastapi-cors==0.0.6` - CORS para frontend
- `pandas==2.1.1` - Exportar a Excel
- `openpyxl==3.1.2` - Crear archivos Excel
- `uvicorn==0.24.0` - Servidor ASGI

#### 2.3 Crear archivo `.env`

Crea el archivo `backend/.env`:

```env
# 🗄️ DATABASE - Supabase PostgreSQL
DATABASE_URL=postgresql://user:password@host:port/database?client_encoding=utf8

# 🔐 SECRET KEY - Para sesiones y tokens
SECRET_KEY=tu_clave_secreta_super_larga_y_segura_12345_xyz_abc_def

# ☁️ CLOUDINARY - Almacenamiento de imágenes
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

**⚠️ IMPORTANTE:** Nunca hagas commit de `.env`. Siempre usa variables de entorno en producción.

---

### Paso 3: Configurar Frontend

El frontend es HTML/CSS/JavaScript vanilla, **no requiere instalación de dependencias**.

#### 3.1 Crear archivo `.env.js` (en `frontend/static/js/`)

Crea el archivo `frontend/static/js/config.js`:

```javascript
// 🔗 Configuración del Frontend

// Desarrollo local
const CONFIG = {
  API_URL: 'http://localhost:8000/api',
  ENV: 'development',
  TIMEOUT: 5000 // milisegundos
};

// Para producción (Render), cambiar a:
// const CONFIG = {
//   API_URL: 'https://sena-inventario-backend.onrender.com/api',
//   ENV: 'production',
//   TIMEOUT: 10000
// };
```

**Luego importar en `index.html`:**
```html
<script src="static/js/config.js"></script>
<script src="static/js/api.js"></script>
<script src="static/js/main.js"></script>
```

---

## 🔧 Configuración de Servicios Externos

### 1️⃣ Supabase (Base de Datos PostgreSQL)

#### Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una nueva cuenta o inicia sesión
3. Click en **New Project**
4. Rellena los datos:
   - **Project name:** `sena-inventario`
   - **Database password:** Crea una contraseña fuerte
   - **Region:** Selecciona la más cercana (ej: `us-east-1` para Colombia)
5. Click en **Create new project**
6. Espera a que termine (puede tomar 2-3 minutos)

#### Obtener Credenciales

1. En el proyecto, ve a **Settings** → **Database**
2. Busca la sección **Connection String** (URI)
3. Copia la cadena de conexión (URI)
4. Reemplaza los placeholders:
   - `[USERNAME]` → Usuario (por defecto `postgres`)
   - `[PASSWORD]` → Contraseña que creaste
5. Pega en `DATABASE_URL` del `.env` backend

**Formato:**
```
postgresql://postgres:TU_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?client_encoding=utf8
```

#### Crear Tablas

El backend crea automáticamente las tablas en la primera ejecución. Si prefieres crearlas manualmente:

1. En Supabase, ve a **SQL Editor**
2. Click en **New query**
3. Ejecuta este SQL:

```sql
-- Tabla de Activos
CREATE TABLE activos (
    id SERIAL PRIMARY KEY,
    placa VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    modelo VARCHAR(100),
    responsable VARCHAR(100),
    cedula_responsable VARCHAR(20),
    ubicacion VARCHAR(100),
    imagenes TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de Historial de Cambios
CREATE TABLE historial_cambios (
    id SERIAL PRIMARY KEY,
    activo_id INTEGER NOT NULL REFERENCES activos(id) ON DELETE CASCADE,
    placa VARCHAR(50),
    responsable VARCHAR(100),
    accion VARCHAR(50),
    descripcion_cambio TEXT,
    fecha_cambio TIMESTAMP DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_activos_placa ON activos(placa);
CREATE INDEX idx_activos_responsable ON activos(responsable);
CREATE INDEX idx_historial_activo ON historial_cambios(activo_id);
```

---

### 2️⃣ Cloudinary (Almacenamiento de Imágenes)

#### Crear Cuenta

1. Ve a [cloudinary.com](https://cloudinary.com)
2. Click en **Sign up**
3. Completa el formulario (email, password, nombre)
4. Confirma tu email
5. Inicia sesión

#### Obtener Credenciales API

1. En el dashboard, ve a **Settings** (rueda de engranaje)
2. Click en la pestaña **API Keys**
3. Verás las credenciales:
   - **Cloud Name:** `dq6enozgx` (ejemplo)
   - **API Key:** Número grande (ejemplo: `766342346187216`)
   - **API Secret:** Texto largo con guiones

4. Pega estas 3 credenciales en `backend/.env`:

```env
CLOUDINARY_CLOUD_NAME=dq6enozgx
CLOUDINARY_API_KEY=766342346187216
CLOUDINARY_API_SECRET=LZjlYondUO-il0BCbg2tf2NVKY
```

#### Crear Carpeta en Cloudinary (Opcional)

Las imágenes se suben a una carpeta llamada `sena-inventario` automáticamente. Para verlas:

1. En Cloudinary, ve a **Media Library**
2. Verás la carpeta `sena-inventario` con todas tus imágenes
3. Las imágenes nunca se borran (almacenamiento permanente)

---

### 3️⃣ Render (Despliegue)

#### Crear Aplicación Backend

1. Ve a [render.com](https://render.com)
2. Crea una cuenta o inicia sesión
3. Click en **New** → **Web Service**
4. Selecciona **Connect a repository**
5. Autoriza GitHub y selecciona: `inventariosennova/sena-inventario-sistema`
6. Configura:
   - **Name:** `sena-inventario-backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Region:** Selecciona la más cercana

7. Click en **Create Web Service**
8. Espera a que termine el despliegue

#### Crear Aplicación Frontend

1. Dentro del proyecto Render, click en **New** → **Static Site**
2. Conecta el mismo repositorio
3. Configura:
   - **Name:** `sena-inventario-frontend`
   - **Build Command:** Deja vacío (no necesita compilar)
   - **Publish Directory:** `frontend`

4. Click en **Create Static Site**

#### Agregar Variables de Entorno

**Para Backend (`sena-inventario-backend`):**

1. Ve a **Environment**
2. Agrega estas variables:

```
DATABASE_URL=postgresql://postgres:PASSWORD@aws-1-us-east-1.pooler.supabase.com:6543/postgres?client_encoding=utf8
SECRET_KEY=sena_2026_inventario_ultra_secreto_12345_xyz_abc_def
CLOUDINARY_CLOUD_NAME=dq6enozgx
CLOUDINARY_API_KEY=766342346187216
CLOUDINARY_API_SECRET=LZjlYondUO-il0BCbg2tf2NVKY
```

3. Click en **Save changes**
4. Render redesplegará automáticamente

**Para Frontend (`sena-inventario-frontend`):**

No requiere variables de entorno adicionales. El frontend se sirve estáticamente desde Render.

---

## 💻 Uso Local

### Iniciar Backend

```bash
cd backend
python -m uvicorn app.main:app --reload
```

**Salida esperada:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

**Acceso:**
- API: `http://localhost:8000`
- Docs interactiva: `http://localhost:8000/docs`

### Abrir Frontend

El frontend es un archivo HTML estático, abre simplemente:

**Opción 1: Abrir directamente en el navegador**
```
Navega a: frontend/index.html
```

**Opción 2: Servir con un servidor local (recomendado)**

Si tienes Python instalado:
```bash
cd frontend
python -m http.server 3000
```

Luego abre en navegador:
```
http://localhost:3000
```

**Si tienes Node.js (con npx):**
```bash
cd frontend
npx http-server -p 3000
```

### Flujo de Uso

1. Abre la app en `http://localhost:3000` (o abre `frontend/index.html`)

2. **Crear Activo:**
   - Click en botón "➕ Nuevo Activo"
   - Rellena los campos (placa, descripción, responsable, etc.)
   - Sube una o más imágenes
   - Click en "Guardar"
   - ✅ La imagen se sube a Cloudinary automáticamente

3. **Ver Activos:**
   - En la lista verás todos los activos creados
   - Puedes buscar por placa, responsable, cédula
   - Click en cualquier activo para ver detalles

4. **Editar Activo:**
   - Click en el ícono de edición (lápiz)
   - Cambia los datos que necesites
   - Puedes agregar más imágenes
   - Click en "Actualizar"

5. **Eliminar Activo:**
   - Click en el ícono de eliminar (papelera)
   - Confirma la acción
   - Se registra en el historial

6. **Ver Historial:**
   - Ve a la sección "📋 Historial"
   - Verás todos los cambios realizados
   - Filtra por activo si quieres

7. **Exportar a Excel:**
   - Click en botón "📥 Descargar Excel"
   - Se descarga archivo `activos_sena.xlsx`
   - Incluye URLs de todas las imágenes

---

## 📡 API Endpoints

### Activos

#### Obtener todos los activos
```http
GET /api/activos
```

**Parámetros opcionales:**
- `placa` - Filtrar por placa
- `responsable` - Filtrar por responsable
- `cedula` - Filtrar por cédula
- `ubicacion` - Filtrar por ubicación
- `skip` - Número de registros a saltar (paginación)
- `limit` - Cantidad de registros a retornar (máximo 50)

**Ejemplo:**
```bash
curl "http://localhost:8000/api/activos?responsable=Juan&limit=10"
```

**Respuesta:**
```json
{
  "total": 25,
  "activos": [
    {
      "id": 1,
      "placa": "ACT-001",
      "descripcion": "Computadora HP",
      "modelo": "ProDesk 400",
      "responsable": "Juan Pérez",
      "cedula_responsable": "1234567890",
      "ubicacion": "Oficina Principal",
      "imagenes": ["https://res.cloudinary.com/..."],
      "created_at": "2026-02-10T14:30:00"
    }
  ]
}
```

---

#### Obtener un activo por ID
```http
GET /api/activos/{activo_id}
```

**Ejemplo:**
```bash
curl "http://localhost:8000/api/activos/1"
```

---

#### Crear nuevo activo
```http
POST /api/activos
Content-Type: multipart/form-data
```

**Campos:**
- `placa` (string, requerido) - Identificador único
- `descripcion` (string, requerido) - Descripción del activo
- `modelo` (string) - Modelo o versión
- `responsable` (string, requerido) - Nombre del responsable
- `cedula_responsable` (string) - Cédula del responsable
- `ubicacion` (string) - Ubicación actual
- `imagenes` (file[], múltiples) - Imágenes (JPG, PNG)

**Ejemplo cURL:**
```bash
curl -X POST http://localhost:8000/api/activos \
  -F "placa=ACT-001" \
  -F "descripcion=Computadora HP" \
  -F "responsable=Juan Pérez" \
  -F "cedula_responsable=1234567890" \
  -F "ubicacion=Oficina Principal" \
  -F "imagenes=@/ruta/imagen.jpg"
```

---

#### Actualizar activo
```http
PUT /api/activos/{activo_id}
Content-Type: multipart/form-data
```

**Campos:** Iguales a crear (todos opcionales)

---

#### Eliminar activo
```http
DELETE /api/activos/{activo_id}
```

---

### Historial

#### Obtener historial de un activo
```http
GET /api/activos/{activo_id}/historial
```

**Retorna:** Array de cambios realizados al activo

---

#### Obtener historial general
```http
GET /api/historial
```

**Retorna:** Últimos 500 cambios del sistema

---

### Exportación

#### Descargar Excel
```http
GET /api/exportar/excel
```

**Retorna:** Archivo XLSX descargable con todos los activos

---

## 🛠️ Solución de Problemas

### ❌ Error: "Database connection refused"

**Causa:** La base de datos no es accesible

**Soluciones:**
1. Verifica que `DATABASE_URL` en `.env` sea correcto
2. Comprueba que Supabase está funcionando: https://supabase.com/status
3. Asegúrate de estar conectado a internet
4. Reinicia el servidor: `Ctrl+C` y vuelve a ejecutar

---

### ❌ Error: "Unknown API key" o "Invalid Signature"

**Causa:** Credenciales de Cloudinary incorrectas

**Soluciones:**
1. Verifica en el dashboard de Cloudinary que las 3 credenciales sean correctas
2. Copia sin espacios en blanco al inicio/final
3. Asegúrate de que `CLOUDINARY_API_SECRET` esté completo
4. Regenera las claves en Cloudinary si es necesario

---

### ❌ Error: "CORS error" en frontend

**Causa:** Backend no permite solicitudes del frontend

**Soluciones:**
1. Verifica que el API URL sea correcto en `config.js`
2. En desarrollo (local): `http://localhost:8000/api`
3. En producción (Render): `https://sena-inventario-backend.onrender.com/api`
4. Backend debe tener CORS habilitado (revisa `app/main.py`)

---

### ❌ Error: "404 Not Found" en frontend

**Causa:** El servidor no está sirviendo los archivos HTML

**Soluciones:**
1. Asegúrate de servir desde la carpeta `frontend`
2. Si usas Python: `python -m http.server 3000` (desde `frontend/`)
3. Verifica que `index.html` existe en `frontend/`

---

### ❌ Error: "File too large" al subir imágenes

**Causa:** Cloudinary tiene límite de tamaño

**Soluciones:**
1. Comprime la imagen antes de subir
2. Máximo recomendado: 10MB por imagen
3. Usa formatos: JPG, PNG, WebP

---

### ❌ Cambios en Git no aparecen en Render

**Causa:** El deploy puede estar retrasado

**Soluciones:**
1. Ve a Render y haz click en **Manual Deploy**
2. Espera a que termine (5-10 minutos)
3. Verifica que `git push` se completó: `git log`

---

### ❌ "Module not found" en backend

**Causa:** Falta instalar dependencias

**Soluciones:**
```bash
pip install -r backend/requirements.txt
pip install --upgrade pip
```

---

### ❌ "Port already in use" localhost:8000

**Causa:** Otra aplicación está usando el puerto

**Soluciones:**
```bash
# Windows
netstat -ano | findstr :8000

# macOS/Linux
lsof -i :8000

# Matar el proceso
kill -9 <PID>
```

---

## 📚 Tecnologías Utilizadas

### Backend
| Tecnología | Versión | Propósito |
|-----------|---------|----------|
| **FastAPI** | 0.104+ | Framework web asincrónico |
| **SQLAlchemy** | 2.0+ | ORM para base de datos |
| **PostgreSQL** | 14+ | Base de datos relacional |
| **Cloudinary** | 1.44+ | Almacenamiento de imágenes en nube |
| **Uvicorn** | 0.24+ | Servidor ASGI |
| **Pandas** | 2.1+ | Procesamiento de datos |
| **Python-dotenv** | 1.0+ | Variables de entorno |

### Frontend
| Tecnología | Descripción |
|-----------|-----------|
| **HTML5** | Estructura semántica |
| **CSS3** | Estilos responsivos |
| **JavaScript (Vanilla)** | Lógica interactiva sin dependencias |
| **Fetch API** | Comunicación con backend |
| **DOM API** | Manipulación de elementos |

### DevOps / Infraestructura
| Servicio | Propósito |
|---------|----------|
| **Render** | Hosting y despliegue (Backend + Frontend) |
| **Supabase** | Base de datos PostgreSQL administrada |
| **Cloudinary** | Almacenamiento y optimización de imágenes |
| **GitHub** | Control de versiones |

---

## 👥 Contribuidores

- **Equipo SENA** - Desarrollo del proyecto
- **Aprendices de Programación** - Implementación

---

## 📝 Licencia

Este proyecto es propiedad del **Servicio Nacional de Aprendizaje (SENA)**.

---

## 📞 Soporte

Para reportar problemas o sugerencias:
1. Abre un **Issue** en GitHub
2. Describe el problema detalladamente
3. Incluye mensajes de error si es posible

---

## 🎯 Roadmap Futuro

- [ ] Autenticación y autorización por roles
- [ ] Notificaciones en tiempo real (WebSockets)
- [ ] Búsqueda avanzada con filtros complejos
- [ ] Reportes PDF personalizados
- [ ] Código QR/Barcode para activos
- [ ] Auditoría avanzada de cambios
- [ ] Importación de activos desde CSV
- [ ] Sincronización offline

---

**Última actualización:** Febrero 2026

**Versión:** 1.0.0 (Stable)

**Status:** ✅ Producción

---

## 🚀 Quick Start

**Modo más rápido para empezar:**

```bash
# 1. Clonar
git clone https://github.com/inventariosennova/sena-inventario-sistema.git

# 2. Backend
cd sena-inventario-sistema/backend
python -m venv venv
# Activar venv (ver instrucciones arriba)
pip install -r requirements.txt
# Crear .env con credenciales
python -m uvicorn app.main:app --reload

# 3. Frontend (en otra terminal)
cd ../frontend
python -m http.server 3000

# 4. Abrir en navegador
# http://localhost:3000
```

¡Listo! 🎉
