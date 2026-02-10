// Configuración API
const API_URL = 'https://sena-inventario-backend.onrender.com/api';


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
let historialActual = []; // último historial cargado
let tituloHistorialActual = '';

function iniciarApp() {
    cargarActivos();
    cargarResponsables();
    cargarUbicaciones();
}

// Cargar activos al iniciar (con login previo)
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('logged') === 'true') {
        iniciarApp();
    } else {
        const modalLogin = document.getElementById('modalLogin');
        if (modalLogin) {
            modalLogin.style.display = 'block';
        }
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const usuario = document.getElementById('loginUsuario').value.trim();
            const password = document.getElementById('loginPassword').value.trim();

            if (usuario === 'sena' && password === 'sena2026') {
                sessionStorage.setItem('logged', 'true');
                document.getElementById('modalLogin').style.display = 'none';
                iniciarApp();
            } else {
                alert('❌ Usuario o contraseña incorrectos');
            }
        });
    }
});

// Función para cargar todos los activos
async function cargarActivos(filtros = {}) {
    try {
        let url = `${API_URL}/activos?`;
        
        if (filtros.placa) {
            url += `placa=${encodeURIComponent(filtros.placa)}&`;
        }
        if (filtros.cedula) {
            url += `cedula=${encodeURIComponent(filtros.cedula)}&`;
        }
        if (filtros.responsable) {
            url += `responsable=${encodeURIComponent(filtros.responsable)}&`;
        }
        if (filtros.ubicacion) {
            url += `ubicacion=${encodeURIComponent(filtros.ubicacion)}&`;
        }
        
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

// Renderizar tabla con paginación
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
            </tr>
        `;
        return;
    }

    const start = 0;
    const end = paginaActivos * PAGE_SIZE;
    const visibles = datos.slice(start, end);
    
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
        if (datos.length > end) {
            paginationDiv.innerHTML = `
                <button class="btn btn-secondary" onclick="verMasActivos()">Ver más</button>
            `;
        } else {
            paginationDiv.innerHTML = '';
        }
    }
}
function verMasActivos() {
    paginaActivos += 1;
    renderizarTabla(activos);
}

// Actualizar contador
function actualizarContador(total) {
    const countElement = document.getElementById('resultsCount');
    const mostrados = Math.min(activos.length, paginaActivos * PAGE_SIZE);
    countElement.textContent = `Mostrando ${mostrados} de ${total} activos`;
}

// Cargar responsables únicos para el filtro
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

// Cargar ubicaciones únicas para el filtro
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

// Buscar activos con filtros
function buscarActivos() {
    const placa = document.getElementById('searchPlaca').value;
    const cedula = document.getElementById('searchCedula').value;
    const responsable = document.getElementById('searchResponsable').value;
    const ubicacion = document.getElementById('searchUbicacion').value;
    
    const filtros = {};
    if (placa) filtros.placa = placa;
    if (cedula) filtros.cedula = cedula;
    if (responsable) filtros.responsable = responsable;
    if (ubicacion) filtros.ubicacion = ubicacion;
    
    cargarActivos(filtros);
}

// Limpiar filtros
function limpiarFiltros() {
    document.getElementById('searchPlaca').value = '';
    document.getElementById('searchCedula').value = '';
    document.getElementById('searchResponsable').value = '';
    if (document.getElementById('searchUbicacion')) {
        document.getElementById('searchUbicacion').value = '';
    }
    cargarActivos();
}

// Exportar a Excel usando el backend
async function exportarExcel() {
    try {
        const response = await fetch(`${API_URL}/exportar/excel`);
        if (!response.ok) {
            throw new Error('No se pudo generar el archivo de Excel');
        }
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
        console.error('Error exportando a Excel:', error);
        mostrarError('Error al exportar a Excel');
    }
}

// Mostrar modal crear
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

// Ver detalles del activo
async function verActivo(id) {
    try {
        const response = await fetch(`${API_URL}/activos/${id}`);
        const activo = await response.json();
        
        const imagenesHtml = activo.imagenes && activo.imagenes.length > 0 
            ? activo.imagenes.map(img => `
                <img src="${img}" alt="Imagen activo" style="max-width: 200px; border-radius: 8px; margin: 5px;">
              `).join('')
            : '<p style="color: #999;">No hay imágenes disponibles</p>';
        
        document.getElementById('detalleContent').innerHTML = `
            <div style="display: grid; gap: 1.5rem;">
                <div class="detail-row">
                    <strong><i class="fas fa-barcode"></i> Placa:</strong> 
                    <span>${activo.placa}</span>
                </div>
                <div class="detail-row">
                    <strong><i class="fas fa-align-left"></i> Descripción:</strong> 
                    <span>${activo.descripcion}</span>
                </div>
                <div class="detail-row">
                    <strong><i class="fas fa-cube"></i> Modelo:</strong> 
                    <span>${activo.modelo || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <strong><i class="fas fa-user"></i> Responsable:</strong> 
                    <span>${activo.responsable}</span>
                </div>
                <div class="detail-row">
                    <strong><i class="fas fa-id-card"></i> Cédula:</strong> 
                    <span>${activo.cedula_responsable || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <strong><i class="fas fa-map-marker-alt"></i> Ubicación:</strong> 
                    <span>${activo.ubicacion || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <strong><i class="fas fa-calendar"></i> Fecha de Registro:</strong> 
                    <span>${new Date(activo.created_at).toLocaleString('es-CO')}</span>
                </div>
                <div class="detail-images">
                    <strong><i class="fas fa-images"></i> Imágenes:</strong>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
                        ${imagenesHtml}
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modalVer').style.display = 'block';
        
    } catch (error) {
        console.error('Error cargando detalles:', error);
        mostrarError('Error al cargar los detalles del activo');
    }
}

// Editar activo
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
        
        // Mostrar imágenes existentes
        const previewDiv = document.getElementById('imagenesPreview');
        previewDiv.innerHTML = '';
        imagenesExistentes.forEach((url, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'preview-item preview-existing';
            wrapper.innerHTML = `
                <img src="${url}" alt="Imagen existente">
                <button type="button" class="btn-mini-delete" data-type="existing" data-index="${index}">×</button>
            `;
            previewDiv.appendChild(wrapper);
        });
        
        document.getElementById('modal').style.display = 'block';
        
    } catch (error) {
        console.error('Error cargando activo para editar:', error);
        mostrarError('Error al cargar el activo');
    }
}

// Cerrar modales
function cerrarModal() {
    document.getElementById('modal').style.display = 'none';
}

function cerrarModalVer() {
    document.getElementById('modalVer').style.display = 'none';
}

function cerrarModalHistorial() {
    document.getElementById('modalHistorial').style.display = 'none';
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    const modalVer = document.getElementById('modalVer');
    const modalHistorial = document.getElementById('modalHistorial');
    const modalLogin = document.getElementById('modalLogin');
    const modalCamara = document.getElementById('modalCamara');
    
    if (event.target === modal) {
        modal.style.display = 'none';
    }
    if (event.target === modalVer) {
        modalVer.style.display = 'none';
    }
    if (event.target === modalHistorial) {
        modalHistorial.style.display = 'none';
    }
    if (event.target === modalLogin) {
        // No cerramos el login al hacer clic fuera para obligar autenticación
    }
    if (event.target === modalCamara) {
        cerrarCamara();
    }
}

// Manejar envío del formulario
document.getElementById('activoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const activoId = document.getElementById('activoId').value;
    const formData = new FormData();
    
    formData.append('placa', document.getElementById('placa').value);
    formData.append('descripcion', document.getElementById('descripcion').value);
    formData.append('modelo', document.getElementById('modelo').value);
    formData.append('responsable', document.getElementById('responsable').value);
    formData.append('cedula_responsable', document.getElementById('cedulaResponsable').value);
    formData.append('ubicacion', document.getElementById('ubicacion').value);

    // En edición: enviar lista de imágenes existentes que se mantienen
    if (activoId) {
        const urlsExistentesVigentes = imagenesExistentes.filter(Boolean);
        formData.append('imagenes_existentes', JSON.stringify(urlsExistentesVigentes));
    }
    
    // Agregar imágenes nuevas desde input
    if (imagenesNuevas.length > 0) {
        imagenesNuevas.filter(Boolean).forEach(file => {
            formData.append('imagenes', file);
        });
    } else {
        const imagenesInput = document.getElementById('imagenes');
        if (imagenesInput.files.length > 0) {
            Array.from(imagenesInput.files).forEach(file => {
                formData.append('imagenes', file);
            });
        }
    }

    // Agregar imágenes capturadas con la cámara
    if (fotosCamara.length > 0) {
        fotosCamara.filter(Boolean).forEach((file) => {
            formData.append('imagenes', file);
        });
    }
    
    try {
        let url = `${API_URL}/activos`;
        let method = 'POST';
        
        if (activoId) {
            url = `${API_URL}/activos/${activoId}`;
            method = 'PUT';
        }
        
        const response = await fetch(url, {
            method: method,
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al guardar');
        }
        
        mostrarExito(activoId ? 'Activo actualizado exitosamente' : 'Activo creado exitosamente');
        cerrarModal();
        cargarActivos();
        
    } catch (error) {
        console.error('Error guardando activo:', error);
        mostrarError(error.message || 'Error al guardar el activo');
    }
});

// Historial general
async function mostrarHistorialGeneral() {
    try {
        const response = await fetch(`${API_URL}/historial`);
        const historial = await response.json();
        historialActual = historial;
        tituloHistorialActual = 'Historial general de cambios';
        paginaHistorial = 1;
        renderizarHistorialPagina();
        document.getElementById('modalHistorial').style.display = 'block';
    } catch (error) {
        console.error('Error cargando historial general:', error);
        mostrarError('Error al cargar el historial general');
    }
}

// Historial por activo
async function mostrarHistorialPorActivo(id, placa) {
    try {
        const response = await fetch(`${API_URL}/activos/${id}/historial`);
        const historial = await response.json();
        historialActual = historial;
        tituloHistorialActual = `Historial de la placa ${placa}`;
        paginaHistorial = 1;
        renderizarHistorialPagina();
        document.getElementById('modalHistorial').style.display = 'block';
    } catch (error) {
        console.error('Error cargando historial del activo:', error);
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
    const visibles = historialActual.slice(0, end);

    const filas = visibles.map(h => `
            <tr>
                <td>${h.placa || ''}</td>
                <td>${h.responsable}</td>
                <td>${h.accion}</td>
                <td>${h.descripcion_cambio}</td>
                <td>${h.fecha_cambio ? new Date(h.fecha_cambio).toLocaleString('es-CO') : ''}</td>
            </tr>
        `).join('');

    const botonVerMas = historialActual.length > end
        ? '<div style="margin-top:1rem; text-align:center;"><button class="btn btn-secondary" onclick="verMasHistorial()">Ver más</button></div>'
        : '';

    cont.innerHTML = `
            <h3 style="margin-bottom: 1rem;">${tituloHistorialActual}</h3>
            <div class="table-container" style="max-height: 60vh; overflow-y: auto;">
                <table class="inventory-table">
                    <thead>
                        <tr>
                            <th>Placa</th>
                            <th>Responsable</th>
                            <th>Acción</th>
                            <th>Descripción cambio</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filas}
                    </tbody>
                </table>
            </div>
            ${botonVerMas}
        `;
}

function verMasHistorial() {
    paginaHistorial += 1;
    renderizarHistorialPagina();
}

// Preview de imágenes al seleccionar
const inputImagenes = document.getElementById('imagenes');
if (inputImagenes) {
    inputImagenes.addEventListener('change', (e) => {
        fotosCamara = []; // limpiar capturas previas si se seleccionan nuevas imágenes
        imagenesNuevas = Array.from(e.target.files);
        const previewDiv = document.getElementById('imagenesPreview');

        // Eliminar solo previews de nuevas anteriores
        Array.from(previewDiv.querySelectorAll('.preview-new')).forEach(el => el.remove());
        
        imagenesNuevas.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'preview-item preview-new';
                wrapper.innerHTML = `
                    <img src="${event.target.result}" alt="Nueva imagen">
                    <button type="button" class="btn-mini-delete" data-type="new" data-index="${index}">×</button>
                `;
                previewDiv.appendChild(wrapper);
            };
            reader.readAsDataURL(file);
        });
    });
}

// Manejo de eliminación en el preview de imágenes
const previewContainer = document.getElementById('imagenesPreview');
if (previewContainer) {
    previewContainer.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn-mini-delete')) return;
        const type = e.target.getAttribute('data-type');
        const index = parseInt(e.target.getAttribute('data-index'), 10);

        if (type === 'existing') {
            imagenesExistentes[index] = null;
        } else if (type === 'new') {
            imagenesNuevas[index] = null;
        } else if (type === 'camera') {
            fotosCamara[index] = null;
        }

        e.target.parentElement.remove();
    });
}

// Funciones de cámara
async function abrirCamara() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('La cámara no es compatible en este navegador/dispositivo');
            return;
        }
        streamCamara = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.getElementById('videoCamara');
        video.srcObject = streamCamara;
        document.getElementById('modalCamara').style.display = 'block';
    } catch (error) {
        console.error('Error abriendo la cámara:', error);
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
    const video = document.getElementById('videoCamara');
    const canvas = document.getElementById('canvasCamara');
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
        if (blob) {
            const file = new File([blob], `foto_cam_${Date.now()}.png`, { type: 'image/png' });
            fotosCamara.push(file);

            // Mostrar preview
            const previewDiv = document.getElementById('imagenesPreview');
            const wrapper = document.createElement('div');
            wrapper.className = 'preview-item preview-new';
            wrapper.innerHTML = `
                <img src="${URL.createObjectURL(blob)}" alt="Foto cámara">
                <button type="button" class="btn-mini-delete" data-type="camera" data-index="${fotosCamara.length - 1}">×</button>
            `;
            previewDiv.appendChild(wrapper);
        }
    }, 'image/png');
}

// Funciones auxiliares
function mostrarExito(mensaje) {
    alert('✅ ' + mensaje);
}

function mostrarError(mensaje) {
    alert('❌ Error: ' + mensaje);
}
