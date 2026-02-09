// Configuración API
const API_URL = 'http://localhost:8000/api';

// Variables globales
let activos = [];
let activoActual = null;

// Cargar activos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    cargarActivos();
    cargarResponsables();
    cargarUbicaciones();
});

// Función para cargar todos los activos
async function cargarActivos(filtros = {}) {
    try {
        let url = `${API_URL}/activos?`;
        
        if (filtros.placa) {
            url += `placa=${encodeURIComponent(filtros.placa)}&`;
        }
        if (filtros.consecutivo) {
            url += `consecutivo=${encodeURIComponent(filtros.consecutivo)}&`;
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
        renderizarTabla(activos);
        actualizarContador(data.total);
        actualizarEstadisticas(data.activos);
        
    } catch (error) {
        console.error('Error cargando activos:', error);
        mostrarError('Error al cargar los datos del inventario');
    }
}

// Renderizar tabla con los nuevos campos
function renderizarTabla(datos) {
    const tbody = document.getElementById('inventoryTableBody');
    
    if (datos.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="8">
                    <div class="empty-message">
                        <i class="fas fa-inbox"></i>
                        <p>No se encontraron registros</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = datos.map(activo => `
        <tr>
            <td><strong>${activo.placa}</strong></td>
            <td>${activo.consecutivo || '-'}</td>
            <td>${activo.descripcion}</td>
            <td>${activo.modelo || '-'}</td>
            <td>
                <div class="responsable-info">
                    <span class="nombre">${activo.responsable}</span>
                    ${activo.cedula_responsable ? `<small>CC: ${activo.cedula_responsable}</small>` : ''}
                </div>
            </td>
            <td>${activo.ubicacion || '-'}</td>
            <td>
                <span class="badge badge-success">
                    <i class="fas fa-check-circle"></i> Activo
                </span>
            </td>
            <td class="actions">
                <button class="btn btn-view" onclick="verActivo(${activo.id})" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-edit" onclick="editarActivo(${activo.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Actualizar contador
function actualizarContador(total) {
    const countElement = document.getElementById('resultsCount');
    const mostrados = activos.length;
    countElement.textContent = `Mostrando ${mostrados} de ${total} activos`;
}

// Actualizar estadísticas
function actualizarEstadisticas(datos) {
    document.getElementById('totalActivos').textContent = datos.length;
    document.getElementById('activosDisponibles').textContent = datos.length;
    
    const responsablesUnicos = [...new Set(datos.map(a => a.responsable))].length;
    document.getElementById('totalResponsables').textContent = responsablesUnicos;
    
    const ubicacionesUnicas = [...new Set(datos.map(a => a.ubicacion).filter(u => u))].length;
    document.getElementById('totalUbicaciones').textContent = ubicacionesUnicas;
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
    const consecutivo = document.getElementById('searchConsecutivo').value;
    const responsable = document.getElementById('searchResponsable').value;
    
    const filtros = {};
    if (placa) filtros.placa = placa;
    if (consecutivo) filtros.consecutivo = consecutivo;
    if (responsable) filtros.responsable = responsable;
    
    cargarActivos(filtros);
}

// Limpiar filtros
function limpiarFiltros() {
    document.getElementById('searchPlaca').value = '';
    document.getElementById('searchConsecutivo').value = '';
    document.getElementById('searchResponsable').value = '';
    if (document.getElementById('searchUbicacion')) {
        document.getElementById('searchUbicacion').value = '';
    }
    cargarActivos();
}

// Exportar a CSV con nuevos campos
function exportarCSV() {
    if (activos.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    const headers = ['Placa', 'Consecutivo', 'Descripción', 'Modelo', 'Responsable', 'Cédula', 'Ubicación', 'Fecha Creación'];
    const rows = activos.map(a => [
        a.placa,
        a.consecutivo || '',
        a.descripcion,
        a.modelo || '',
        a.responsable,
        a.cedula_responsable || '',
        a.ubicacion || '',
        new Date(a.created_at).toLocaleDateString()
    ]);
    
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.map(field => `"${field}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventario_sena_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Mostrar modal crear
function mostrarModalCrear() {
    activoActual = null;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Nuevo Activo';
    document.getElementById('activoForm').reset();
    document.getElementById('activoId').value = '';
    document.getElementById('imagenesPreview').innerHTML = '';
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
                    <strong><i class="fas fa-hashtag"></i> Consecutivo:</strong> 
                    <span>${activo.consecutivo || 'N/A'}</span>
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

// Editar activo con nuevos campos
async function editarActivo(id) {
    try {
        const response = await fetch(`${API_URL}/activos/${id}`);
        const activo = await response.json();
        
        activoActual = activo;
        
        document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Activo';
        document.getElementById('activoId').value = activo.id;
        document.getElementById('placa').value = activo.placa;
        document.getElementById('consecutivo').value = activo.consecutivo || '';
        document.getElementById('descripcion').value = activo.descripcion;
        document.getElementById('modelo').value = activo.modelo || '';
        document.getElementById('responsable').value = activo.responsable;
        document.getElementById('cedulaResponsable').value = activo.cedula_responsable || '';
        document.getElementById('ubicacion').value = activo.ubicacion || '';
        
        // Mostrar imágenes existentes
        if (activo.imagenes && activo.imagenes.length > 0) {
            const previewDiv = document.getElementById('imagenesPreview');
            previewDiv.innerHTML = activo.imagenes.map(img => `
                <img src="${img}" alt="Imagen">
            `).join('');
        }
        
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

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    const modalVer = document.getElementById('modalVer');
    
    if (event.target === modal) {
        modal.style.display = 'none';
    }
    if (event.target === modalVer) {
        modalVer.style.display = 'none';
    }
}

// Manejar envío del formulario con nuevos campos
document.getElementById('activoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const activoId = document.getElementById('activoId').value;
    const formData = new FormData();
    
    formData.append('placa', document.getElementById('placa').value);
    formData.append('consecutivo', document.getElementById('consecutivo').value);
    formData.append('descripcion', document.getElementById('descripcion').value);
    formData.append('modelo', document.getElementById('modelo').value);
    formData.append('responsable', document.getElementById('responsable').value);
    formData.append('cedula_responsable', document.getElementById('cedulaResponsable').value);
    formData.append('ubicacion', document.getElementById('ubicacion').value);
    
    // Agregar imágenes
    const imagenesInput = document.getElementById('imagenes');
    if (imagenesInput.files.length > 0) {
        Array.from(imagenesInput.files).forEach(file => {
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

// Preview de imágenes al seleccionar
document.getElementById('imagenes').addEventListener('change', (e) => {
    const previewDiv = document.getElementById('imagenesPreview');
    previewDiv.innerHTML = '';
    
    Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target.result;
            previewDiv.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
});

// Funciones auxiliares
function mostrarExito(mensaje) {
    alert('✅ ' + mensaje);
}

function mostrarError(mensaje) {
    alert('❌ Error: ' + mensaje);
}
