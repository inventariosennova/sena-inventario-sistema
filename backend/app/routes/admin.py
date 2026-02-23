# backend/app/routes/admin.py
import os
import uuid
import requests

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import text

from app.database.database import engine

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ─── Modelos ────────────────────────────────────────────────
class InvitacionIn(BaseModel):
    email: str
    nombre: str


# ─── Utilidad: enviar email con Brevo API ───────────────────
def enviar_email_brevo(to_email: str, nombre: str, invite_link: str):
    api_key      = os.getenv("BREVO_API_KEY")
    sender_email = os.getenv("SENDER_EMAIL", "inventariosennova@gmail.com")

    if not api_key:
        raise RuntimeError("Falta variable: BREVO_API_KEY")

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">

        <div style="background: #39a900; padding: 24px 20px;
                    border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">
                Sistema Inventario SENA
            </h1>
            <p style="color: #e8f5e9; margin: 6px 0 0; font-size: 14px;">
                SENNOVA CEAI
            </p>
        </div>

        <div style="padding: 32px 28px; border: 1px solid #ddd;
                    border-top: none; border-radius: 0 0 10px 10px;
                    background: #ffffff;">

            <p style="font-size: 16px; color: #333;">
                Hola <strong>{nombre}</strong>,
            </p>
            <p style="color: #555; line-height: 1.6;">
                El instructor lider te ha invitado a acceder al
                <strong>Sistema de Inventario SENA SENNOVA CEAI</strong>.
            </p>
            <p style="color: #555;">
                Haz click en el boton para acceder al sistema:
            </p>

            <div style="text-align: center; margin: 32px 0;">
                <a href="{invite_link}"
                   style="background: #39a900; color: white;
                          padding: 14px 36px; border-radius: 8px;
                          text-decoration: none; font-size: 16px;
                          font-weight: bold; display: inline-block;">
                    Acceder al Sistema
                </a>
            </div>

            <p style="color: #888; font-size: 13px;">
                Si el boton no funciona, copia este link en tu navegador:
            </p>
            <p style="background: #f5f5f5; padding: 10px; border-radius: 6px;
                      font-size: 12px; color: #555; word-break: break-all;">
                {invite_link}
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="color: #bbb; font-size: 11px; text-align: center;">
                Este es un mensaje automatico del Sistema Inventario SENA.<br>
                Si no esperabas esta invitacion, ignora este correo.<br>
                Este enlace es de un solo uso.
            </p>
        </div>
    </div>
    """

    response = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={
            "accept":       "application/json",
            "api-key":      api_key,
            "content-type": "application/json"
        },
        json={
            "sender":      {"name": "Sistema SENA", "email": sender_email},
            "to":          [{"email": to_email, "name": nombre}],
            "subject":     "Invitacion - Sistema Inventario SENA SENNOVA",
            "htmlContent": html_body
        },
        timeout=30
    )

    if response.status_code not in (200, 201):
        raise RuntimeError(f"Error Brevo: {response.status_code} - {response.text}")


# ─── Endpoint 1: Crear invitación + enviar email ─────────────
@router.post("/invitar")
def invitar_instructor(payload: InvitacionIn):
    frontend_url = os.getenv("FRONTEND_URL", "").rstrip("/")
    if not frontend_url:
        raise HTTPException(
            status_code=500,
            detail="Variable FRONTEND_URL no configurada."
        )

    token       = str(uuid.uuid4())
    invite_link = f"{frontend_url}/?invite={token}"

    # ── Guardar en base de datos ─────────────────────────────
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
            detail=f"Error guardando invitacion en BD: {str(e)}"
        )

    # ── Enviar correo con Brevo ──────────────────────────────
    try:
        enviar_email_brevo(payload.email, payload.nombre, invite_link)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Invitacion guardada pero error enviando correo: {str(e)}"
        )

    return {
        "ok":      True,
        "mensaje": f"Invitacion enviada al correo {payload.email}",
        "token":   token,
        "link":    invite_link
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


# ─── Endpoint 3: Validar token ──────────────────────────────
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
                detail="Invitacion no encontrada."
            )
        if row["usado"]:
            raise HTTPException(
                status_code=400,
                detail="Esta invitacion ya fue utilizada."
            )
        return {
            "ok":     True,
            "email":  row["email"],
            "nombre": row["nombre"]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error validando invitacion: {str(e)}"
        )



# ─── Endpoint 4: Marcar como usada ──────────────────────────
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
                detail="Token invalido o ya fue usado."
            )
        return {"ok": True, "mensaje": "Invitacion marcada como usada."}


    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error marcando invitacion: {str(e)}"
        )
