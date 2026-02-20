# backend/app/routes/admin.py
import os
import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import text

from app.database.database import engine

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ─── Modelos ────────────────────────────────────────────────
class InvitacionIn(BaseModel):
    email: str
    nombre: str


# ─── Endpoint 1: Crear invitación (sin email) ───────────────
@router.post("/invitar")
def invitar_instructor(payload: InvitacionIn):
    frontend_url = os.getenv("FRONTEND_URL", "").rstrip("/")
    if not frontend_url:
        raise HTTPException(
            status_code=500,
            detail="Variable FRONTEND_URL no configurada en el servidor."
        )

    token = str(uuid.uuid4())
    invite_link = f"{frontend_url}/?invite={token}"

    # Guardar en base de datos (upsert por email)
    try:
        with engine.begin() as conn:
            conn.execute(text("""
                INSERT INTO invitaciones (email, nombre, token, usado, created_at, usado_at)
                VALUES (:email, :nombre, :token, false, now(), null)
                ON CONFLICT (email)
                DO UPDATE SET
                    nombre     = EXCLUDED.nombre,
                    token      = EXCLUDED.token,
                    usado      = false,
                    created_at = now(),
                    usado_at   = null
            """), {
                "email":  payload.email,
                "nombre": payload.nombre,
                "token":  token
            })
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error guardando invitación: {str(e)}"
        )

    # Retorna el link para que el admin lo comparta manualmente
    return {
        "ok": True,
        "mensaje": f"Invitación creada para {payload.email}",
        "token": token,
        "link": invite_link  # ← Admin copia este link y lo envía
    }


# ─── Endpoint 2: Listar invitaciones ────────────────────────
@router.get("/invitaciones")
def listar_invitaciones():
    try:
        with engine.begin() as conn:
            rows = conn.execute(text("""
                SELECT email, nombre, usado, created_at, usado_at
                FROM invitaciones
                ORDER BY created_at DESC
                LIMIT 200
            """)).mappings().all()
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error listando invitaciones: {str(e)}"
        )


# ─── Endpoint 3: Validar token de invitación ────────────────
@router.get("/validar-invitacion")
def validar_invitacion(token: str):
    try:
        with engine.begin() as conn:
            row = conn.execute(text("""
                SELECT email, nombre, usado
                FROM invitaciones
                WHERE token = :token
                LIMIT 1
            """), {"token": token}).mappings().first()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="Invitación no encontrada."
            )
        if row["usado"]:
            raise HTTPException(
                status_code=400,
                detail="Esta invitación ya fue utilizada."
            )
        return {
            "ok": True,
            "email": row["email"],
            "nombre": row["nombre"]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error validando invitación: {str(e)}"
        )


# ─── Endpoint 4: Marcar invitación como usada ───────────────
@router.post("/marcar-usada")
def marcar_usada(token: str):
    try:
        with engine.begin() as conn:
            result = conn.execute(text("""
                UPDATE invitaciones
                SET usado = true, usado_at = now()
                WHERE token = :token AND usado = false
            """), {"token": token})

        if result.rowcount == 0:
            raise HTTPException(
                status_code=400,
                detail="Token inválido o ya fue usado."
            )
        return {"ok": True, "mensaje": "Invitación marcada como usada."}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error marcando invitación: {str(e)}"
        )
