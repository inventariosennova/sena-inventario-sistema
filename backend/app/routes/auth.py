# backend/app/routes/auth.py
import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy import text

from app.database.database import engine

router = APIRouter(prefix="/api/auth", tags=["Auth"])

SECRET_KEY = os.getenv("JWT_SECRET", "sena_2026_inventario_ultra_secreto_12345_xyz_abc_def")
ALGORITHM  = "HS256"
TOKEN_EXPIRE_HOURS = 8

pwd_context    = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme  = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# ─── Modelos ─────────────────────────────────────────────────
class RegisterIn(BaseModel):
    token_invitacion: str
    password: str

class LoginIn(BaseModel):
    email: str
    password: str


# ─── Utilidades JWT ──────────────────────────────────────────
def crear_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verificar_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

def get_usuario_actual(token: str = Depends(oauth2_scheme)) -> Optional[dict]:
    if not token:
        return None
    return verificar_token(token)

def requiere_auth(usuario = Depends(get_usuario_actual)):
    if not usuario:
        raise HTTPException(status_code=401, detail="No autenticado.")
    return usuario

def requiere_admin(usuario = Depends(get_usuario_actual)):
    if not usuario or usuario.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="Se requiere rol admin.")
    return usuario


# ─── Endpoint 1: Registrarse con token de invitación ─────────
@router.post("/registro")
def registrarse(payload: RegisterIn):
    with engine.begin() as conn:
        # Validar token de invitación
        inv = conn.execute(text("""
            SELECT email, nombre, usado FROM invitaciones
            WHERE token = :token LIMIT 1
        """), {"token": payload.token_invitacion}).mappings().first()

        if not inv:
            raise HTTPException(status_code=404, detail="Token de invitación inválido.")
        if inv["usado"]:
            raise HTTPException(status_code=400, detail="Este token ya fue utilizado.")

        # Verificar si ya existe usuario
        existe = conn.execute(text("""
            SELECT id FROM usuarios WHERE email = :email LIMIT 1
        """), {"email": inv["email"]}).first()
        if existe:
            raise HTTPException(status_code=400, detail="Este correo ya tiene cuenta registrada.")

        # Crear usuario
        hashed = pwd_context.hash(payload.password)
        conn.execute(text("""
            INSERT INTO usuarios (email, nombre, password, rol)
            VALUES (:email, :nombre, :password, 'usuario')
        """), {"email": inv["email"], "nombre": inv["nombre"], "password": hashed})

        # Marcar invitación como usada
        conn.execute(text("""
            UPDATE invitaciones SET usado = true, usado_at = now()
            WHERE token = :token
        """), {"token": payload.token_invitacion})

    return {"ok": True, "mensaje": "Usuario registrado correctamente."}


# ─── Endpoint 2: Login ────────────────────────────────────────
@router.post("/login")
def login(payload: LoginIn):
    with engine.begin() as conn:
        user = conn.execute(text("""
            SELECT id, email, nombre, password, rol, activo
            FROM usuarios WHERE email = :email LIMIT 1
        """), {"email": payload.email}).mappings().first()

    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas.")
    if not user["activo"]:
        raise HTTPException(status_code=403, detail="Usuario desactivado.")
    if not pwd_context.verify(payload.password, user["password"]):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas.")

    token = crear_token({
        "sub":    user["email"],
        "nombre": user["nombre"],
        "rol":    user["rol"],
        "id":     user["id"]
    })

    return {
        "ok":          True,
        "access_token": token,
        "token_type":  "bearer",
        "rol":         user["rol"],
        "nombre":      user["nombre"],
        "email":       user["email"]
    }


# ─── Endpoint 3: Verificar token activo ──────────────────────
@router.get("/me")
def get_me(usuario = Depends(requiere_auth)):
    return {"ok": True, "usuario": usuario}
