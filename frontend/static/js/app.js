// Configuración API
const API_URL = 'https://sena-inventario-sistema.onrender.com/api';
const ADMIN_API = `${API_URL}/admin`;

// Variables globales
let activos = [];
let activoActual = null;
let streamCamara = null;
let fotosCamara = [];
let imagenesExistentes = [];
let imagenesNuevas = [];

// Paginación básica en frontend
const PAGE_SIZE = 10;
let paginaActivos = 1;
let paginaHistorial = 1;
let historialActual = [];
let tituloHistorialActual = '';

function iniciarApp() {
    cargarActivos();
    cargarResponsables();
    cargarUbicaciones();
}

// Cargar activos al iniciar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    iniciarApp();

    // Login Admin Form
    const adminForm = document.getElementById('adminLoginForm');
    if (adminForm) {
        adminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const correo = document.getElementById('adminCorreo').value.trim();
            const clave  = document.getElementById('adminClave').value.trim();

            // ✅ DESPUÉS (tus valores reales de Render)
                const adminEmail = 'inventariosennova@gmail.com';
                const adminPass  = 'Sennova12.';
            // ← mismo valor que pusiste en Render ADMIN_PASS

            if (correo === adminEmail && clave === adminPass) {
                sessionStorage.setItem('admin_ok', 'true');
                cerrarModalAdmin();
                abrirModalInvitaciones();
                await cargarInvitacionesAdmin();
            } else {
                alert('❌ Correo o contraseña incorrectos');
            }
        });
    }

    // Si el instructor llega con un link de invitación (?invite=TOKEN)
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get('invite');
    if (inviteToken) {
        validarInvitacion(inviteToken);
    }
});

// ─── Cargar activos ──────────────────────────────────────────
async function cargarActivos(filtros = {}) {
    try {
        let url = `${API_URL}/activos?`;
        if (filtros.placa)      url += `placa=${encodeURIComponent(filtros.placa)}&`;
        if (filtros.cedula)     url += `cedula=${encodeURIComponent(filtros.cedula)}&`;
        if (filtros.responsable) url += `responsable=${encodeURIComponent(filtros.responsable)}&`;
        if (filtros.ubicacion)  url += `ubicacion=${encodeURIComponent(filtros.ubicacion)}&`;

        const response = await fetch(url);
        const data = await response.json();

        activos = data.activos;
        paginaActivos = 1;
        renderizarTabla(activos);
        actualizarContador(data.total);
    } catch (error) {
        console.error('Error cargando activos:', error);
        const detalle = (error && error.message) ? `: ${error.message}` : '';
        mostrarError('Error al cargar los datos del inventario' + detalle);
    }
}

// ─── Renderizar tabla ────────────────────────────────────────
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

    const end = paginaActivos * PAGE_SIZE;
    const visibles = datos.slice(0, end);

    tbody.innerHTML = visibles.map(activo => {
        const desc = activo.descripcion || '';
        const descripcionCorta = desc.length > 80 ? desc.substring(0, 80) + '…' : desc;
        return `
        <tr>
            <td><strong>${activo.placa}</strong></td>
            <td class="descripcion-col" title="${desc.replace(/"/g, '&quot;')}">${descripcionCorta}</td>
            <td>${activo.modelo || '-'}</td>
            <td>
                <div class="responsable-info">
                    <span class="nombre">${activo.responsable}</span>
                    ${activo.cedula_responsable ? `<small>CC: ${activo.cedula_responsable}</small>` : ''}
                </div>
            </td>
            <td>${activo.ubicacion || '-'}</td>
            <td class="actions">
                <button class="btn btn-view" onclick="verActivo(${activo.id})" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-edit" onclick="editarActivo(${activo.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>`;
    }).join('');

    if (paginationDiv) {
        paginationDiv.innerHTML = datos.length > end
            ? `<button class="btn btn-secondary" onclick="verMasActivos()">Ver más</button>`
            : '';
    }
}

function verMasActivos() {
    paginaActivos += 1;
    renderizarTabla(activos);
}

// ─── Contador ────────────────────────────────────────────────
function actualizarContador(total) {
    const countElement = document.getElementById('resultsCount');
    const mostrados = Math.min(activos.length, paginaActivos * PAGE_SIZE);
    countElement.textContent = `Mostrando ${mostrados} de ${total} activos`;
}

// ─── Cargar responsables ─────────────────────────────────────
async function cargarResponsables() {
    try {
        const response = await fetch(`${API_URL}/activos?limit=1000`);
        const data = await response.json();
        const responsables = [...new Set(data.activos.map(a => a.responsable))];
        const select = document.getElementById('searchResponsable');
        responsables.forEach(resp => {
            const option = document.createElement('option');
            option.value = resp;
            option.textContent = resp;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando responsables:', error);
    }
}

// ─── Cargar ubicaciones ──────────────────────────────────────
async function cargarUbicaciones() {
    try {
        const response = await fetch(`${API_URL}/activos?limit=1000`);
        const data = await response.json();
        const ubicaciones = [...new Set(data.activos.map(a => a.ubicacion).filter(u => u))];
        const select = document.getElementById('searchUbicacion');
        ubicaciones.forEach(ubi => {
            const option = document.createElement('option');
            option.value = ubi;
            option.textContent = ubi;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando ubicaciones:', error);
    }
}

// ─── Buscar / Limpiar ────────────────────────────────────────
function buscarActivos() {
    const filtros = {};
    const placa = document.getElementById('searchPlaca').value;
    const cedula = document.getElementById('searchCedula').value;
    const responsable = document.getElementById('searchResponsable').value;
    const ubicacion = document.getElementById('searchUbicacion').value;
    if (placa) filtros.placa = placa;
    if (cedula) filtros.cedula = cedula;
    if (responsable) filtros.responsable = responsable;
    if (ubicacion) filtros.ubicacion = ubicacion;
    cargarActivos(filtros);
}

function limpiarFiltros() {
    document.getElementById('searchPlaca').value = '';
    document.getElementById('searchCedula').value = '';
    document.getElementById('searchResponsable').value = '';
    if (document.getElementById('searchUbicacion')) {
        document.getElementById('searchUbicacion').value = '';
    }
    cargarActivos();
}

// ─── Exportar Excel ──────────────────────────────────────────
async function exportarExcel() {
    try {
        const response = await fetch(`${API_URL}/exportar/excel`);
        if (!response.ok) throw new Error('No se pudo generar el archivo de Excel');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'activos_sena.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        mostrarError('Error al exportar a Excel');
    }
}

// ─── Modal Crear ─────────────────────────────────────────────
function mostrarModalCrear() {
    activoActual = null;
    imagenesExistentes = [];
    imagenesNuevas = [];
    fotosCamara = [];
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Nuevo Activo';
    document.getElementById('activoForm').reset();
    document.getElementById('activoId').value = '';
    document.getElementById('imagenesPreview').innerHTML = '';
    document.getElementById('imagenes').value = '';
    document.getElementById('modal').style.display = 'block';
}

// ─── Ver detalles ────────────────────────────────────────────
async function verActivo(id) {
    try {
        const response = await fetch(`${API_URL}/activos/${id}`);
        const activo = await response.json();
        const imagenesHtml = activo.imagenes && activo.imagenes.length > 0
            ? activo.imagenes.map(img => `
                <img src="${img}" alt="Imagen activo"
                     style="max-width:200px; border-radius:8px; margin:5px;">`
              ).join('')
            : '<p style="color:#999;">No hay imágenes disponibles</p>';

        document.getElementById('detalleContent').innerHTML = `
            <div style="display:grid; gap:1.5rem;">
                <div class="detail-row"><strong><i class="fas fa-barcode"></i> Placa:</strong> <span>${activo.placa}</span></div>
                <div class="detail-row"><strong><i class="fas fa-align-left"></i> Descripción:</strong> <span>${activo.descripcion}</span></div>
                <div class="detail-row"><strong><i class="fas fa-cube"></i> Modelo:</strong> <span>${activo.modelo || 'N/A'}</span></div>
                <div class="detail-row"><strong><i class="fas fa-user"></i> Responsable:</strong> <span>${activo.responsable}</span></div>
                <div class="detail-row"><strong><i class="fas fa-id-card"></i> Cédula:</strong> <span>${activo.cedula_responsable || 'N/A'}</span></div>
                <div class="detail-row"><strong><i class="fas fa-map-marker-alt"></i> Ubicación:</strong> <span>${activo.ubicacion || 'N/A'}</span></div>
                <div class="detail-row"><strong><i class="fas fa-calendar"></i> Fecha:</strong> <span>${new Date(activo.created_at).toLocaleString('es-CO')}</span></div>
                <div class="detail-images">
                    <strong><i class="fas fa-images"></i> Imágenes:</strong>
                    <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:10px;">${imagenesHtml}</div>
                </div>
            </div>`;
        document.getElementById('modalVer').style.display = 'block';
    } catch (error) {
        mostrarError('Error al cargar los detalles del activo');
    }
}

// ─── Editar activo ───────────────────────────────────────────
async function editarActivo(id) {
    try {
        const response = await fetch(`${API_URL}/activos/${id}`);
        const activo = await response.json();
        activoActual = activo;
        imagenesExistentes = Array.isArray(activo.imagenes) ? [...activo.imagenes] : [];
        imagenesNuevas = [];
        fotosCamara = [];
        document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Activo';
        document.getElementById('activoId').value = activo.id;
        document.getElementById('placa').value = activo.placa;
        document.getElementById('descripcion').value = activo.descripcion;
        document.getElementById('modelo').value = activo.modelo || '';
        document.getElementById('responsable').value = activo.responsable;
        document.getElementById('cedulaResponsable').value = activo.cedula_responsable || '';
        document.getElementById('ubicacion').value = activo.ubicacion || '';
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

// ─── Cerrar modales ──────────────────────────────────────────
function cerrarModal()          { document.getElementById('modal').style.display = 'none'; }
function cerrarModalVer()       { document.getElementById('modalVer').style.display = 'none'; }
function cerrarModalHistorial() { document.getElementById('modalHistorial').style.display = 'none'; }

// ─── Click fuera = cerrar ────────────────────────────────────
window.onclick = function(event) {
    const ids = ['modal','modalVer','modalHistorial','modalCamara',
                 'modalAdminLogin','modalInvitaciones'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (event.target === el) {
            if (id === 'modalCamara') { cerrarCamara(); }
            else { el.style.display = 'none'; }
        }
    });
};

// ─── Formulario guardar activo ───────────────────────────────
document.getElementById('activoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const activoId = document.getElementById('activoId').value;
    const formData = new FormData();
    formData.append('placa',              document.getElementById('placa').value);
    formData.append('descripcion',        document.getElementById('descripcion').value);
    formData.append('modelo',             document.getElementById('modelo').value);
    formData.append('responsable',        document.getElementById('responsable').value);
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
        const response = await fetch(url, { method, body: formData });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Error al guardar');
        }
        mostrarExito(activoId ? 'Activo actualizado exitosamente' : 'Activo creado exitosamente');
        cerrarModal();
        cargarActivos();
    } catch (error) {
        mostrarError(error.message || 'Error al guardar el activo');
    }
});

// ─── Historial general ───────────────────────────────────────
async function mostrarHistorialGeneral() {
    try {
        const response = await fetch(`${API_URL}/historial`);
        historialActual = await response.json();
        tituloHistorialActual = 'Historial general de cambios';
        paginaHistorial = 1;
        renderizarHistorialPagina();
        document.getElementById('modalHistorial').style.display = 'block';
    } catch (error) {
        mostrarError('Error al cargar el historial general');
    }
}

async function mostrarHistorialPorActivo(id, placa) {
    try {
        const response = await fetch(`${API_URL}/activos/${id}/historial`);
        historialActual = await response.json();
        tituloHistorialActual = `Historial de la placa ${placa}`;
        paginaHistorial = 1;
        renderizarHistorialPagina();
        document.getElementById('modalHistorial').style.display = 'block';
    } catch (error) {
        mostrarError('Error al cargar el historial del activo');
    }
}

function renderizarHistorialPagina() {
    const cont = document.getElementById('historialContent');
    if (!historialActual || historialActual.length === 0) {
        cont.innerHTML = '<p>No hay registros de historial para mostrar.</p>';
        return;
    }
    const end = paginaHistorial * PAGE_SIZE;
    const filas = historialActual.slice(0, end).map(h => `
        <tr>
            <td>${h.placa || ''}</td>
            <td>${h.responsable}</td>
            <td>${h.accion}</td>
            <td>${h.descripcion_cambio}</td>
            <td>${h.fecha_cambio ? new Date(h.fecha_cambio).toLocaleString('es-CO') : ''}</td>
        </tr>`).join('');

    const botonVerMas = historialActual.length > end
        ? `<div style="text-align:center; margin-top:1rem;">
               <button class="btn btn-secondary" onclick="verMasHistorial()">Ver más</button>
           </div>` : '';

    cont.innerHTML = `
        <h3 style="margin-bottom:1rem;">${tituloHistorialActual}</h3>
        <div class="table-container" style="max-height:60vh; overflow-y:auto;">
            <table class="inventory-table">
                <thead>
                    <tr>
                        <th>Placa</th><th>Responsable</th>
                        <th>Acción</th><th>Descripción cambio</th><th>Fecha</th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
        </div>${botonVerMas}`;
}

function verMasHistorial() {
    paginaHistorial += 1;
    renderizarHistorialPagina();
}

// ─── Preview imágenes ────────────────────────────────────────
const inputImagenes = document.getElementById('imagenes');
if (inputImagenes) {
    inputImagenes.addEventListener('change', (e) => {
        fotosCamara = [];
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
        if (type === 'existing') imagenesExistentes[index] = null;
        else if (type === 'new')  imagenesNuevas[index] = null;
        else if (type === 'camera') fotosCamara[index] = null;
        e.target.parentElement.remove();
    });
}

// ─── Cámara ──────────────────────────────────────────────────
async function abrirCamara() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('La cámara no es compatible en este navegador/dispositivo');
            return;
        }
        streamCamara = await navigator.mediaDevices.getUserMedia({ video: true });
        document.getElementById('videoCamara').srcObject = streamCamara;
        document.getElementById('modalCamara').style.display = 'block';
    } catch (error) {
        mostrarError('No se pudo acceder a la cámara');
    }
}

function cerrarCamara() {
    const modal = document.getElementById('modalCamara');
    if (modal) modal.style.display = 'none';
    if (streamCamara) {
        streamCamara.getTracks().forEach(t => t.stop());
        streamCamara = null;
    }
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
        const wrapper = document.createElement('div');
        wrapper.className = 'preview-item preview-new';
        wrapper.innerHTML = `
            <img src="${URL.createObjectURL(blob)}" alt="Foto cámara">
            <button type="button" class="btn-mini-delete"
                data-type="camera" data-index="${fotosCamara.length - 1}">×</button>`;
        previewDiv.appendChild(wrapper);
    }, 'image/png');
}

// ─── Auxiliares ──────────────────────────────────────────────
function mostrarExito(mensaje) { alert('✅ ' + mensaje); }
function mostrarError(mensaje)  { alert('❌ Error: ' + mensaje); }


// =============================================
// ========== SISTEMA ADMIN ================
// =============================================

function abrirModalAdmin() {
    document.getElementById('modalAdminLogin').style.display = 'block';
}

function cerrarModalAdmin() {
    document.getElementById('modalAdminLogin').style.display = 'none';
    document.getElementById('adminLoginForm').reset();
}

function abrirModalInvitaciones() {
    document.getElementById('modalInvitaciones').style.display = 'block';
}

function cerrarModalInvitaciones() {
    document.getElementById('modalInvitaciones').style.display = 'none';
    document.getElementById('invLinkBox').style.display = 'none';
    sessionStorage.removeItem('admin_ok');
}

// ─── Enviar / crear invitación ───────────────────────────────
async function enviarInvitacionAdmin() {
    const email  = document.getElementById('invEmail').value.trim();
    const nombre = document.getElementById('invNombre').value.trim();

    if (!email || !nombre) {
        return alert('❌ Completa el correo y el nombre del instructor');
    }

    try {
        const res = await fetch(`${ADMIN_API}/invitar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, nombre })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'No se pudo crear la invitación');

        // Mostrar caja con el link generado
        document.getElementById('invLinkTexto').value = data.link;
        document.getElementById('invLinkBox').style.display = 'block';

        // Limpiar campos
        document.getElementById('invEmail').value  = '';
        document.getElementById('invNombre').value = '';

        // Recargar lista
        await cargarInvitacionesAdmin();

    } catch (err) {
        alert('❌ Error: ' + err.message);
    }
}

// ─── Copiar link al portapapeles ─────────────────────────────
function copiarLink() {
    const input = document.getElementById('invLinkTexto');
    input.select();
    input.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(input.value)
        .then(() => alert('✅ Link copiado al portapapeles'))
        .catch(() => {
            document.execCommand('copy');
            alert('✅ Link copiado');
        });
}

// ─── Cargar lista de invitaciones ────────────────────────────
async function cargarInvitacionesAdmin() {
    const cont = document.getElementById('listaInvitaciones');
    if (!cont) return;

    try {
        const res  = await fetch(`${ADMIN_API}/invitaciones`);
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
            cont.innerHTML = '<p style="color:#999;">No hay invitaciones aún.</p>';
            return;
        }

        const filas = data.map(inv => `
            <tr>
                <td>${inv.nombre || ''}</td>
                <td>${inv.email}</td>
                <td>
                    <span style="
                        padding: 4px 10px; border-radius: 12px; font-size: 12px;
                        background: ${inv.usado ? '#d4edda' : '#fff3cd'};
                        color: ${inv.usado ? '#155724' : '#856404'};">
                        ${inv.usado ? '✅ Usado' : '⏳ Pendiente'}
                    </span>
                </td>
                <td>${inv.created_at
                    ? new Date(inv.created_at).toLocaleString('es-CO')
                    : ''}</td>
            </tr>`).join('');

        cont.innerHTML = `
            <div class="table-container" style="max-height:300px; overflow-y:auto;">
                <table class="inventory-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Correo</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>`;
    } catch (err) {
        cont.innerHTML = '<p style="color:#999;">Error cargando invitaciones.</p>';
    }
}

// ─── Validar token de invitación (cuando instructor abre link) ──
async function validarInvitacion(token) {
    try {
        const res  = await fetch(`${ADMIN_API}/validar-invitacion?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.detail || 'Invitación inválida');

        // Marcar como usada
        await fetch(`${ADMIN_API}/marcar-usada?token=${encodeURIComponent(token)}`,
            { method: 'POST' });

        // Limpiar token de la URL
        const url = new URL(window.location.href);
        url.searchParams.delete('invite');
        window.history.replaceState({}, '', url.toString());

        alert(`✅ ¡Bienvenido(a) ${data.nombre}!\nYa tienes acceso al sistema de inventario SENA.`);

    } catch (err) {
        alert('❌ ' + err.message);
    }
}
