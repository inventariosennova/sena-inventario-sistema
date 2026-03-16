# backend/app/routes/historial_sesiones.py
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy import text
from app.routes.auth import requiere_admin, get_usuario_actual
from app.database.database import engine
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/admin", tags=["Historial y Sesiones"])


# ─── Modelos Pydantic ─────────────────────────────────────────
class RegistrarSesionIn(BaseModel):
    usuario_id: int
    email: str
    nombre: str
    ip_address: str | None = None
    user_agent: str | None = None


# ─── Endpoint: Registrar sesión (en login) ────────────────────
@router.post("/sesion/inicio")
def registrar_sesion_inicio(payload: RegistrarSesionIn):
    """Registra el inicio de sesión de un usuario"""
    try:
        with engine.begin() as conn:
            result = conn.execute(text("""
                INSERT INTO sesiones_usuarios (usuario_id, email, nombre, fecha_ingreso, ip_address, user_agent)
                VALUES (:usuario_id, :email, :nombre, now(), :ip_address, :user_agent)
                RETURNING id
            """), {
                "usuario_id": payload.usuario_id,
                "email": payload.email,
                "nombre": payload.nombre,
                "ip_address": payload.ip_address,
                "user_agent": payload.user_agent
            })
            sesion_id = result.scalar()
        return {"ok": True, "sesion_id": sesion_id, "mensaje": "Sesión registrada"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error registrando sesión: {str(e)}")


# ─── Endpoint: Registrar salida de sesión ─────────────────────
@router.post("/sesion/cierre")
def registrar_sesion_cierre(email: str, admin = Depends(requiere_admin)):
    """Registra la salida de sesión de un usuario"""
    try:
        with engine.begin() as conn:
            conn.execute(text("""
                UPDATE sesiones_usuarios
                SET fecha_salida = now()
                WHERE email = :email AND fecha_salida IS NULL
                ORDER BY fecha_ingreso DESC
                LIMIT 1
            """), {"email": email})
        return {"ok": True, "mensaje": "Sesión cerrada registrada"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cerrando sesión: {str(e)}")


# ─── Endpoint: Obtener historial completo (solo admin) ────────
@router.get("/historial-completo")
def obtener_historial_completo(admin = Depends(requiere_admin)):
    """Retorna el historial de cambios de los activos con detalles completos"""
    try:
        with engine.begin() as conn:
            rows = conn.execute(text("""
                SELECT 
                    hc.id,
                    hc.activo_id,
                    hc.placa,
                    hc.responsable,
                    hc.accion,
                    hc.descripcion_cambio,
                    hc.fecha_cambio,
                    u.email AS usuario_email
                FROM historial_cambios hc
                LEFT JOIN usuarios u ON LOWER(u.nombre) = LOWER(hc.responsable)
                ORDER BY hc.fecha_cambio DESC
                LIMIT 500
            """)).mappings().all()
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo historial: {str(e)}")


# ─── Endpoint: Obtener sesiones de usuarios (solo admin) ──────
@router.get("/historial-sesiones")
def obtener_historial_sesiones(admin = Depends(requiere_admin)):
    """Retorna el historial de sesiones de todos los usuarios"""
    try:
        with engine.begin() as conn:
            rows = conn.execute(text("""
                SELECT 
                    id,
                    usuario_id,
                    email,
                    nombre,
                    fecha_ingreso,
                    fecha_salida,
                    ip_address,
                    user_agent,
                    EXTRACT(EPOCH FROM (COALESCE(fecha_salida, now()) - fecha_ingreso)) / 3600 AS duracion_horas
                FROM sesiones_usuarios
                ORDER BY fecha_ingreso DESC
                LIMIT 500
            """)).mappings().all()
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo sesiones: {str(e)}")


# ─── Endpoint: Eliminar historial de cambios (solo admin) ─────
@router.delete("/historial-limpiar")
def limpiar_historial(admin = Depends(requiere_admin)):
    """Elimina TODOS los registros de historial de cambios. ¡Acción irreversible!"""
    try:
        with engine.begin() as conn:
            result = conn.execute(text("""
                DELETE FROM historial_cambios
            """))
        return {
            "ok": True,
            "mensaje": f"Historial eliminado. {result.rowcount} registros removidos.",
            "registros_eliminados": result.rowcount
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error limpiando historial: {str(e)}")


# ─── Endpoint: Eliminar sesiones antiguas (solo admin) ────────
@router.delete("/historial-sesiones-limpiar")
def limpiar_sesiones_antiguas(admin = Depends(requiere_admin), dias: int = 30):
    """Elimina sesiones más antiguas que N días"""
    try:
        with engine.begin() as conn:
            result = conn.execute(text("""
                DELETE FROM sesiones_usuarios
                WHERE fecha_ingreso < now() - INTERVAL ':dias days'
            """), {"dias": dias})
        return {
            "ok": True,
            "mensaje": f"Sesiones antiguas (>{dias} días) eliminadas. {result.rowcount} registros removidos.",
            "registros_eliminados": result.rowcount
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error limpiando sesiones: {str(e)}")


# ─── Endpoint: Obtener notificaciones (solo admin) ────────────
@router.get("/notificaciones")
def obtener_notificaciones(admin = Depends(requiere_admin)):
    """Retorna todas las notificaciones del sistema"""
    try:
        with engine.begin() as conn:
            rows = conn.execute(text("""
                SELECT 
                    id,
                    tipo,
                    titulo,
                    mensaje,
                    leida,
                    fecha_creacion,
                    usuario_email
                FROM notificaciones
                ORDER BY leida ASC, fecha_creacion DESC
                LIMIT 200
            """)).mappings().all()
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo notificaciones: {str(e)}")


# ─── Endpoint: Marcar notificación como leída (solo admin) ────
@router.post("/notificaciones/{notif_id}/marcar-leida")
def marcar_notificacion_leida(notif_id: int, admin = Depends(requiere_admin)):
    """Marca una notificación como leída"""
    try:
        with engine.begin() as conn:
            result = conn.execute(text("""
                UPDATE notificaciones
                SET leida = true
                WHERE id = :id
            """), {"id": notif_id})
            if result.rowcount == 0:
                raise HTTPException(status_code=404, detail="Notificación no encontrada")
        return {"ok": True, "mensaje": "Notificación marcada como leída"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error marcando notificación: {str(e)}")


# ─── Endpoint: Crear notificación (solo admin) ────────────────
@router.post("/notificaciones/crear")
def crear_notificacion(
    tipo: str,
    titulo: str,
    mensaje: str,
    usuario_email: str | None = None,
    admin = Depends(requiere_admin)
):
    """Crea una notificación en el sistema"""
    try:
        with engine.begin() as conn:
            conn.execute(text("""
                INSERT INTO notificaciones (tipo, titulo, mensaje, usuario_email, leida)
                VALUES (:tipo, :titulo, :mensaje, :usuario_email, false)
            """), {
                "tipo": tipo,
                "titulo": titulo,
                "mensaje": mensaje,
                "usuario_email": usuario_email
            })
        return {"ok": True, "mensaje": "Notificación creada"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando notificación: {str(e)}")
