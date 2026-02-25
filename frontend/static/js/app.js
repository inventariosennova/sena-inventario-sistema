// =============================================
// CONFIGURACIÓN
// =============================================
const API_URL  = 'https://sena-inventario-sistema.onrender.com/api';
const ADMIN_API = `${API_URL}/admin`;
const AUTH_API  = `${API_URL}/auth`;


// =============================================
// VARIABLES GLOBALES
// =============================================
let activos            = [];
let activoActual       = null;
let streamCamara       = null;
let fotosCamara        = [];
let imagenesExistentes = [];
let imagenesNuevas     = [];
const PAGE_SIZE        = 10;
let paginaActivos      = 1;
let paginaHistorial    = 1;
let historialActual    = [];
let tituloHistorialActual = '';


// =============================================
// AUTH — utilidades de sesión
// =============================================
function getToken()     { return localStorage.getItem('token'); }
function getUsuario()   {
    const u = localStorage.getItem('usuario');
    return u ? JSON.parse(u) : null;
}
function getRol()       { return getUsuario()?.rol || null; }
function estaLogueado() { return !!getToken(); }
function esAdmin()      { return getRol() === 'admin'; }
function esUsuario()    { return getRol() === 'usuario'; }
function puedeEditar()  { return estaLogueado(); }


function guardarSesion(data) {
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('usuario', JSON.stringify({
        email:  data.email,
        nombre: data.nombre,
        rol:    data.rol
    }));
}


function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    actualizarNavbar();
    renderizarTabla(activos);
    mostrarExito('Sesión cerrada correctamente');
}


function headersAuth() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}


// =============================================
// NAVBAR
// =============================================
function actualizarNavbar() {
    const usuario     = getUsuario();
    const btnLogin    = document.getElementById('btnLogin');
    const btnCerrar   = document.getElementById('btnCerrarSesion');
    const infoUsuario = document.getElementById('infoUsuario');
    const btnAdmin    = document.getElementById('btnAbrirAdmin');

    if (usuario) {
        if (infoUsuario) {
            const badge = usuario.rol === 'admin'
                ? `<span style="background:#39a900;color:white;padding:2px 8px;border-radius:10px;font-size:11px;">Admin</span>`
                : `<span style="background:#007bff;color:white;padding:2px 8px;border-radius:10px;font-size:11px;">Usuario</span>`;
            infoUsuario.innerHTML = `<i class="fas fa-user-circle"></i> ${usuario.nombre} ${badge}`;
            infoUsuario.style.display = 'inline-flex';
        }
        if (btnLogin)  btnLogin.style.display  = 'none';
        if (btnCerrar) btnCerrar.style.display = 'inline-flex';
        if (btnAdmin)  btnAdmin.style.display  = usuario.rol === 'admin' ? 'inline-flex' : 'none';
    } else {
        if (infoUsuario) infoUsuario.style.display = 'none';
        if (btnLogin)  btnLogin.style.display  = 'inline-flex';
        if (btnCerrar) btnCerrar.style.display = 'none';
        if (btnAdmin)  btnAdmin.style.display  = 'none';
    }
}


// =============================================
// DOMContentLoaded
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    actualizarNavbar();
    iniciarApp();

    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get('invite');
    if (inviteToken) abrirModalRegistro(inviteToken);

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email    = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();
            await hacerLogin(email, password);
        });
    }

    const registroForm = document.getElementById('registroForm');
    if (registroForm) {
        registroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await hacerRegistro();
        });
    }
});


// =============================================
// LOGIN
// =============================================
function abrirModalLogin() {
    document.getElementById('modalLogin').style.display = 'block';
}
function cerrarModalLogin() {
    document.getElementById('modalLogin').style.display = 'none';
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').style.display = 'none';
}


async function hacerLogin(email, password) {
    try {
        const res = await fetch(`${AUTH_API}/login`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) {
            document.getElementById('loginError').textContent = data.detail || 'Credenciales incorrectas';
            document.getElementById('loginError').style.display = 'block';
            return;
        }

        guardarSesion(data);
        cerrarModalLogin();
        actualizarNavbar();
        renderizarTabla(activos);
        mostrarExito(`¡Bienvenido(a) ${data.nombre}!`);

        if (data.rol === 'admin') {
            abrirModalInvitaciones();
            await cargarInvitacionesAdmin();
        }

    } catch (err) {
        document.getElementById('loginError').textContent = 'Error de conexión';
        document.getElementById('loginError').style.display = 'block';
    }
}


// =============================================
// REGISTRO (con token de invitación)
// =============================================
function abrirModalRegistro(token) {
    fetch(`${ADMIN_API}/validar-invitacion?token=${encodeURIComponent(token)}`)
        .then(r => r.json())
        .then(data => {
            if (!data.ok) { alert('❌ Invitación inválida o ya utilizada'); return; }
            document.getElementById('registroEmail').value  = data.email;
            document.getElementById('registroNombre').value = data.nombre;
            document.getElementById('registroToken').value  = token;
            document.getElementById('modalRegistro').style.display = 'block';
            const url = new URL(window.location.href);
            url.searchParams.delete('invite');
            window.history.replaceState({}, '', url.toString());
        })
        .catch(() => alert('❌ Error validando la invitación'));
}


function cerrarModalRegistro() {
    document.getElementById('modalRegistro').style.display = 'none';
    document.getElementById('registroError').style.display = 'none';
}


async function hacerRegistro() {
    const token    = document.getElementById('registroToken').value;
    const password = document.getElementById('registroPassword').value;
    const confirm  = document.getElementById('registroConfirm').value;

    if (password.length < 6) {
        document.getElementById('registroError').textContent = 'La contraseña debe tener al menos 6 caracteres';
        document.getElementById('registroError').style.display = 'block';
        return;
    }
    if (password !== confirm) {
        document.getElementById('registroError').textContent = 'Las contraseñas no coinciden';
        document.getElementById('registroError').style.display = 'block';
        return;
    }

    try {
        const res = await fetch(`${AUTH_API}/registro`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ token_invitacion: token, password })
        });
        const data = await res.json();

        if (!res.ok) {
            document.getElementById('registroError').textContent = data.detail || 'Error al registrar';
            document.getElementById('registroError').style.display = 'block';
            return;
        }

        cerrarModalRegistro();
        mostrarExito('¡Cuenta creada! Ahora inicia sesión con tu correo y contraseña.');
        abrirModalLogin();

    } catch (err) {
        document.getElementById('registroError').textContent = 'Error de conexión';
        document.getElementById('registroError').style.display = 'block';
    }
}


// =============================================
// APP PRINCIPAL
// =============================================
function iniciarApp() {
    cargarActivos();
    cargarCuentadantes();   // ← era cargarResponsables
    cargarUbicaciones();
}


async function cargarActivos(filtros = {}) {
    try {
        let url = `${API_URL}/activos?`;
        if (filtros.placa)        url += `placa=${encodeURIComponent(filtros.placa)}&`;
        if (filtros.cedula)       url += `cedula=${encodeURIComponent(filtros.cedula)}&`;
        if (filtros.cuentadante)  url += `cuentadante=${encodeURIComponent(filtros.cuentadante)}&`;
        if (filtros.ubicacion)    url += `ubicacion=${encodeURIComponent(filtros.ubicacion)}&`;
        const response = await fetch(url);
        const data = await response.json();
        activos = data.activos;
        paginaActivos = 1;
        renderizarTabla(activos);
        actualizarContador(data.total);
    } catch (error) {
        mostrarError('Error al cargar los datos del inventario');
    }
}


// =============================================
// TABLA — botones según rol
// =============================================
function renderizarTabla(datos) {
    const tbody = document.getElementById('inventoryTableBody');
    const paginationDiv = document.getElementById('pagination');

    if (datos.length === 0) {
        if (paginationDiv) paginationDiv.innerHTML = '';
        tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="6">
                    <div class="empty-message">
                        <i class="fas fa-inbox"></i>
                        <p>No se encontraron registros</p>
                    </div>
                </td>
            </tr>`;
        return;
    }

    const end     = paginaActivos * PAGE_SIZE;
    const visibles = datos.slice(0, end);

    tbody.innerHTML = visibles.map(activo => {
        const desc = activo.descripcion || '';
        const descripcionCorta = desc.length > 80 ? desc.substring(0, 80) + '…' : desc;

        const btnEditar = puedeEditar()
            ? `<button class="btn btn-edit" onclick="editarActivo(${activo.id})" title="Editar">
                   <i class="fas fa-edit"></i>
               </button>`
            : '';

        const btnEliminar = esAdmin()
            ? `<button class="btn btn-danger" onclick="eliminarActivo(${activo.id})" title="Eliminar">
                   <i class="fas fa-trash"></i>
               </button>`
            : '';

        return `
        <tr>
            <td><strong>${activo.placa}</strong></td>
            <td class="descripcion-col" title="${desc.replace(/"/g, '&quot;')}">${descripcionCorta}</td>
            <td>${activo.modelo || '-'}</td>
            <td>
                <div class="responsable-info">
                    <span class="nombre">${activo.responsable}</span>
                    ${activo.cedula_responsable
                        ? `<small>CC: ${activo.cedula_responsable}</small>`
                        : ''}
                </div>
            </td>
            <td>${activo.ubicacion || '-'}</td>
            <td class="actions">
                <button class="btn btn-view" onclick="verActivo(${activo.id})" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                ${btnEditar}
                ${btnEliminar}
            </td>
        </tr>`;
    }).join('');

    if (paginationDiv) {
        paginationDiv.innerHTML = datos.length > end
            ? `<button class="btn btn-secondary" onclick="verMasActivos()">Ver más</button>`
            : '';
    }
}


function verMasActivos() { paginaActivos += 1; renderizarTabla(activos); }


function actualizarContador(total) {
    const countElement = document.getElementById('resultsCount');
    const mostrados = Math.min(activos.length, paginaActivos * PAGE_SIZE);
    countElement.textContent = `Mostrando ${mostrados} de ${total} activos`;
}


// =============================================
// CREAR / EDITAR (requiere login)
// =============================================
function mostrarModalCrear() {
    if (!puedeEditar()) { abrirModalLogin(); return; }
    activoActual       = null;
    imagenesExistentes = [];
    imagenesNuevas     = [];
    fotosCamara        = [];
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Nuevo Activo';
    document.getElementById('activoForm').reset();
    document.getElementById('activoId').value = '';
    document.getElementById('imagenesPreview').innerHTML = '';
    document.getElementById('imagenes').value = '';
    document.getElementById('modal').style.display = 'block';
}


async function editarActivo(id) {
    if (!puedeEditar()) { abrirModalLogin(); return; }
    try {
        const response = await fetch(`${API_URL}/activos/${id}`);
        const activo   = await response.json();
        activoActual       = activo;
        imagenesExistentes = Array.isArray(activo.imagenes) ? [...activo.imagenes] : [];
        imagenesNuevas     = [];
        fotosCamara        = [];

        document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Activo';
        document.getElementById('activoId').value          = activo.id;
        document.getElementById('placa').value             = activo.placa;
        document.getElementById('descripcion').value       = activo.descripcion;
        document.getElementById('modelo').value            = activo.modelo || '';
        document.getElementById('responsable').value       = activo.responsable;   // id del input no cambia
        document.getElementById('cedulaResponsable').value = activo.cedula_responsable || '';
        document.getElementById('ubicacion').value         = activo.ubicacion || '';

        const previewDiv = document.getElementById('imagenesPreview');
        previewDiv.innerHTML = '';
        imagenesExistentes.forEach((url, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'preview-item preview-existing';
            wrapper.innerHTML = `
                <img src="${url}" alt="Imagen existente">
                <button type="button" class="btn-mini-delete"
                    data-type="existing" data-index="${index}">×</button>`;
            previewDiv.appendChild(wrapper);
        });
        document.getElementById('modal').style.display = 'block';
    } catch (error) {
        mostrarError('Error al cargar el activo');
    }
}


// =============================================
// FORMULARIO GUARDAR (con token)
// =============================================
document.getElementById('activoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!puedeEditar()) { cerrarModal(); abrirModalLogin(); return; }

    const activoId = document.getElementById('activoId').value;
    const formData = new FormData();
    formData.append('placa',              document.getElementById('placa').value);
    formData.append('descripcion',        document.getElementById('descripcion').value);
    formData.append('modelo',             document.getElementById('modelo').value);
    formData.append('cuentadante',        document.getElementById('responsable').value);  // ← cambiado
    formData.append('cedula_responsable', document.getElementById('cedulaResponsable').value);
    formData.append('ubicacion',          document.getElementById('ubicacion').value);

    if (activoId) {
        const vigentes = imagenesExistentes.filter(Boolean);
        formData.append('imagenes_existentes', JSON.stringify(vigentes));
    }
    if (imagenesNuevas.length > 0) {
        imagenesNuevas.filter(Boolean).forEach(f => formData.append('imagenes', f));
    } else {
        const inp = document.getElementById('imagenes');
        if (inp.files.length > 0)
            Array.from(inp.files).forEach(f => formData.append('imagenes', f));
    }
    if (fotosCamara.length > 0)
        fotosCamara.filter(Boolean).forEach(f => formData.append('imagenes', f));

    try {
        const url    = activoId ? `${API_URL}/activos/${activoId}` : `${API_URL}/activos`;
        const method = activoId ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method,
            body:    formData,
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (!response.ok) {
            const err = await response.json();
            if (response.status === 401) { cerrarModal(); abrirModalLogin(); return; }
            throw new Error(err.detail || 'Error al guardar');
        }
        mostrarExito(activoId ? 'Activo actualizado exitosamente' : 'Activo creado exitosamente');
        cerrarModal();
        cargarActivos();
    } catch (error) {
        mostrarError(error.message || 'Error al guardar el activo');
    }
});


// =============================================
// ELIMINAR (solo admin)
// =============================================
async function eliminarActivo(id) {
    if (!esAdmin()) { mostrarError('Solo el admin puede eliminar activos'); return; }
    if (!confirm('¿Estás seguro de eliminar este activo?')) return;
    try {
        const res = await fetch(`${API_URL}/activos/${id}`, {
            method:  'DELETE',
            headers: headersAuth()
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Error al eliminar');
        }
        mostrarExito('Activo eliminado exitosamente');
        cargarActivos();
    } catch (err) {
        mostrarError(err.message);
    }
}


// =============================================
// VER DETALLES
// =============================================
async function verActivo(id) {
    try {
        const response = await fetch(`${API_URL}/activos/${id}`);
        const activo   = await response.json();
        const imagenesHtml = activo.imagenes && activo.imagenes.length > 0
            ? activo.imagenes.map(img =>
                `<img src="${img}" alt="Imagen activo"
                      style="max-width:200px;border-radius:8px;margin:5px;">`
              ).join('')
            : '<p style="color:#999;">No hay imágenes disponibles</p>';

        document.getElementById('detalleContent').innerHTML = `
            <div style="display:grid;gap:1.5rem;">
                <div class="detail-row"><strong><i class="fas fa-barcode"></i> Placa:</strong> <span>${activo.placa}</span></div>
                <div class="detail-row"><strong><i class="fas fa-align-left"></i> Descripción:</strong> <span>${activo.descripcion}</span></div>
                <div class="detail-row"><strong><i class="fas fa-cube"></i> Modelo:</strong> <span>${activo.modelo || 'N/A'}</span></div>
                <div class="detail-row"><strong><i class="fas fa-user"></i> Cuentadante:</strong> <span>${activo.responsable}</span></div>
                <div class="detail-row"><strong><i class="fas fa-id-card"></i> Cédula:</strong> <span>${activo.cedula_responsable || 'N/A'}</span></div>
                <div class="detail-row"><strong><i class="fas fa-map-marker-alt"></i> Ubicación:</strong> <span>${activo.ubicacion || 'N/A'}</span></div>
                <div class="detail-row"><strong><i class="fas fa-calendar"></i> Fecha:</strong> <span>${new Date(activo.created_at).toLocaleString('es-CO')}</span></div>
                <div class="detail-images">
                    <strong><i class="fas fa-images"></i> Imágenes:</strong>
                    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;">${imagenesHtml}</div>
                </div>
            </div>`;
        document.getElementById('modalVer').style.display = 'block';
    } catch (error) {
        mostrarError('Error al cargar los detalles del activo');
    }
}


// =============================================
// CUENTADANTES Y UBICACIONES
// =============================================
async function cargarCuentadantes() {
    try {
        const response = await fetch(`${API_URL}/activos?limit=1000`);
        const data     = await response.json();
        const cuentadantes = [...new Set(data.activos.map(a => a.responsable).filter(Boolean))];
        const select   = document.getElementById('searchResponsable');
        cuentadantes.forEach(c => {
            const option = document.createElement('option');
            option.value = c; option.textContent = c;
            select.appendChild(option);
        });
    } catch (error) { console.error('Error cargando cuentadantes:', error); }
}


async function cargarUbicaciones() {
    try {
        const response = await fetch(`${API_URL}/activos?limit=1000`);
        const data     = await response.json();
        const ubicaciones = [...new Set(data.activos.map(a => a.ubicacion).filter(Boolean))];
        const select   = document.getElementById('searchUbicacion');
        ubicaciones.forEach(ubi => {
            const option = document.createElement('option');
            option.value = ubi; option.textContent = ubi;
            select.appendChild(option);
        });
    } catch (error) { console.error('Error cargando ubicaciones:', error); }
}


// =============================================
// BÚSQUEDA Y FILTROS
// =============================================
function buscarActivos() {
    const filtros     = {};
    const placa       = document.getElementById('searchPlaca').value;
    const cedula      = document.getElementById('searchCedula').value;
    const cuentadante = document.getElementById('searchResponsable').value;  // ← cambiado
    const ubicacion   = document.getElementById('searchUbicacion').value;
    if (placa)        filtros.placa       = placa;
    if (cedula)       filtros.cedula      = cedula;
    if (cuentadante)  filtros.cuentadante = cuentadante;                     // ← cambiado
    if (ubicacion)    filtros.ubicacion   = ubicacion;
    cargarActivos(filtros);
}


function limpiarFiltros() {
    document.getElementById('searchPlaca').value      = '';
    document.getElementById('searchCedula').value     = '';
    document.getElementById('searchResponsable').value = '';
    if (document.getElementById('searchUbicacion'))
        document.getElementById('searchUbicacion').value = '';
    cargarActivos();
}


// =============================================
// EXCEL
// =============================================
async function exportarExcel() {
    try {
        const response = await fetch(`${API_URL}/exportar/excel`);
        if (!response.ok) throw new Error('No se pudo generar el archivo');
        const blob = await response.blob();
        const url  = window.URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = 'activos_sena.xlsx';
        document.body.appendChild(a); a.click(); a.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) { mostrarError('Error al exportar a Excel'); }
}


// =============================================
// CERRAR MODALES
// =============================================
function cerrarModal()          { document.getElementById('modal').style.display = 'none'; }
function cerrarModalVer()       { document.getElementById('modalVer').style.display = 'none'; }
function cerrarModalHistorial() { document.getElementById('modalHistorial').style.display = 'none'; }


window.onclick = function(event) {
    const ids = ['modal','modalVer','modalHistorial','modalCamara',
                 'modalLogin','modalRegistro','modalInvitaciones'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (event.target === el) {
            if (id === 'modalCamara') cerrarCamara();
            else el.style.display = 'none';
        }
    });
};


// =============================================
// HISTORIAL
// =============================================
async function mostrarHistorialGeneral() {
    try {
        const response  = await fetch(`${API_URL}/historial`);
        historialActual = await response.json();
        tituloHistorialActual = 'Historial general de cambios';
        paginaHistorial = 1;
        renderizarHistorialPagina();
        document.getElementById('modalHistorial').style.display = 'block';
    } catch (error) { mostrarError('Error al cargar el historial'); }
}


async function mostrarHistorialPorActivo(id, placa) {
    try {
        const response  = await fetch(`${API_URL}/activos/${id}/historial`);
        historialActual = await response.json();
        tituloHistorialActual = `Historial de la placa ${placa}`;
        paginaHistorial = 1;
        renderizarHistorialPagina();
        document.getElementById('modalHistorial').style.display = 'block';
    } catch (error) { mostrarError('Error al cargar el historial del activo'); }
}


function renderizarHistorialPagina() {
    const cont = document.getElementById('historialContent');
    if (!historialActual || historialActual.length === 0) {
        cont.innerHTML = '<p>No hay registros de historial.</p>'; return;
    }
    const end   = paginaHistorial * PAGE_SIZE;
    const filas = historialActual.slice(0, end).map(h => `
        <tr>
            <td>${h.placa || ''}</td>
            <td>${h.responsable}</td>
            <td>${h.accion}</td>
            <td>${h.descripcion_cambio}</td>
            <td>${h.fecha_cambio ? new Date(h.fecha_cambio).toLocaleString('es-CO') : ''}</td>
        </tr>`).join('');
    const botonVerMas = historialActual.length > end
        ? `<div style="text-align:center;margin-top:1rem;">
               <button class="btn btn-secondary" onclick="verMasHistorial()">Ver más</button>
           </div>` : '';
    cont.innerHTML = `
        <h3 style="margin-bottom:1rem;">${tituloHistorialActual}</h3>
        <div class="table-container" style="max-height:60vh;overflow-y:auto;">
            <table class="inventory-table">
                <thead>
                    <tr>
                        <th>Placa</th><th>Cuentadante</th>
                        <th>Acción</th><th>Descripción</th><th>Fecha</th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
        </div>${botonVerMas}`;
}


function verMasHistorial() { paginaHistorial += 1; renderizarHistorialPagina(); }


// =============================================
// PREVIEW IMÁGENES
// =============================================
const inputImagenes = document.getElementById('imagenes');
if (inputImagenes) {
    inputImagenes.addEventListener('change', (e) => {
        fotosCamara    = [];
        imagenesNuevas = Array.from(e.target.files);
        const previewDiv = document.getElementById('imagenesPreview');
        Array.from(previewDiv.querySelectorAll('.preview-new')).forEach(el => el.remove());
        imagenesNuevas.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'preview-item preview-new';
                wrapper.innerHTML = `
                    <img src="${ev.target.result}" alt="Nueva imagen">
                    <button type="button" class="btn-mini-delete"
                        data-type="new" data-index="${index}">×</button>`;
                previewDiv.appendChild(wrapper);
            };
            reader.readAsDataURL(file);
        });
    });
}


const previewContainer = document.getElementById('imagenesPreview');
if (previewContainer) {
    previewContainer.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn-mini-delete')) return;
        const type  = e.target.getAttribute('data-type');
        const index = parseInt(e.target.getAttribute('data-index'), 10);
        if (type === 'existing')     imagenesExistentes[index] = null;
        else if (type === 'new')     imagenesNuevas[index]     = null;
        else if (type === 'camera')  fotosCamara[index]        = null;
        e.target.parentElement.remove();
    });
}


// =============================================
// CÁMARA
// =============================================
async function abrirCamara() {
    try {
        if (!navigator.mediaDevices?.getUserMedia) {
            alert('La cámara no es compatible en este navegador'); return;
        }
        streamCamara = await navigator.mediaDevices.getUserMedia({ video: true });
        document.getElementById('videoCamara').srcObject = streamCamara;
        document.getElementById('modalCamara').style.display = 'block';
    } catch (error) { mostrarError('No se pudo acceder a la cámara'); }
}


function cerrarCamara() {
    const modal = document.getElementById('modalCamara');
    if (modal) modal.style.display = 'none';
    if (streamCamara) { streamCamara.getTracks().forEach(t => t.stop()); streamCamara = null; }
}


function capturarFoto() {
    const video   = document.getElementById('videoCamara');
    const canvas  = document.getElementById('canvasCamara');
    const context = canvas.getContext('2d');
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], `foto_cam_${Date.now()}.png`, { type: 'image/png' });
        fotosCamara.push(file);
        const previewDiv = document.getElementById('imagenesPreview');
        const wrapper    = document.createElement('div');
        wrapper.className = 'preview-item preview-new';
        wrapper.innerHTML = `
            <img src="${URL.createObjectURL(blob)}" alt="Foto cámara">
            <button type="button" class="btn-mini-delete"
                data-type="camera" data-index="${fotosCamara.length - 1}">×</button>`;
        previewDiv.appendChild(wrapper);
    }, 'image/png');
}


// =============================================
// PANEL ADMIN
// =============================================
function abrirModalAdmin() {
    if (!esAdmin()) { abrirModalLogin(); return; }
    abrirModalInvitaciones();
    cargarInvitacionesAdmin();
}


function abrirModalInvitaciones() {
    document.getElementById('modalInvitaciones').style.display = 'block';
}


function cerrarModalInvitaciones() {
    document.getElementById('modalInvitaciones').style.display = 'none';
    document.getElementById('invLinkBox').style.display = 'none';
}


async function enviarInvitacionAdmin() {
    const email  = document.getElementById('invEmail').value.trim();
    const nombre = document.getElementById('invNombre').value.trim();
    if (!email || !nombre) { alert('❌ Completa el correo y nombre'); return; }
    try {
        const res = await fetch(`${ADMIN_API}/invitar`, {
            method:  'POST',
            headers: headersAuth(),
            body:    JSON.stringify({ email, nombre })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'No se pudo crear la invitación');
        document.getElementById('invLinkTexto').value = data.link;
        document.getElementById('invLinkBox').style.display = 'block';
        document.getElementById('invEmail').value  = '';
        document.getElementById('invNombre').value = '';
        await cargarInvitacionesAdmin();
    } catch (err) { alert('❌ Error: ' + err.message); }
}


function copiarLink() {
    const input = document.getElementById('invLinkTexto');
    input.select();
    navigator.clipboard.writeText(input.value)
        .then(() => alert('✅ Link copiado'))
        .catch(() => { document.execCommand('copy'); alert('✅ Link copiado'); });
}


async function cargarInvitacionesAdmin() {
    const cont = document.getElementById('listaInvitaciones');
    if (!cont) return;
    try {
        const res  = await fetch(`${ADMIN_API}/invitaciones`, { headers: headersAuth() });
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
            cont.innerHTML = '<p style="color:#999;">No hay invitaciones aún.</p>'; return;
        }
        const filas = data.map(inv => `
            <tr>
                <td>${inv.nombre || ''}</td>
                <td>${inv.email}</td>
                <td>
                    <span style="padding:4px 10px;border-radius:12px;font-size:12px;
                        background:${inv.usado ? '#d4edda' : '#fff3cd'};
                        color:${inv.usado ? '#155724' : '#856404'};">
                        ${inv.usado ? '✅ Usado' : '⏳ Pendiente'}
                    </span>
                </td>
                <td>${inv.created_at ? new Date(inv.created_at).toLocaleString('es-CO') : ''}</td>
            </tr>`).join('');
        cont.innerHTML = `
            <div class="table-container" style="max-height:300px;overflow-y:auto;">
                <table class="inventory-table">
                    <thead>
                        <tr><th>Nombre</th><th>Correo</th><th>Estado</th><th>Fecha</th></tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>`;
    } catch (err) { cont.innerHTML = '<p style="color:#999;">Error cargando invitaciones.</p>'; }
}


// =============================================
// AUXILIARES
// =============================================
function mostrarExito(mensaje) { alert('✅ ' + mensaje); }
function mostrarError(mensaje)  { alert('❌ Error: ' + mensaje); }
