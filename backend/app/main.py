from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.routes import inventario
from app.routes.admin import router as admin_router  # ← LÍNEA NUEVA
from app.database.database import init_db
import os
from pathlib import Path


app = FastAPI(title="Sistema Inventario SENA SENNOVA CEAI")


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routes.auth import router as auth_router
app.include_router(auth_router)



# Crear carpeta uploads si no existe
Path("uploads").mkdir(exist_ok=True)


# Montar carpeta de uploads PRIMERO
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# Incluir rutas API
app.include_router(inventario.router)
app.include_router(admin_router)  # ← LÍNEA NUEVA


@app.on_event("startup")
async def startup_event():
    init_db()


@app.get("/health")
async def health():
    return {"status": "ok"}


# Montar archivos estáticos del frontend AL FINAL
frontend_path = os.path.join(os.path.dirname(__file__), "../../frontend")
if os.path.exists(frontend_path):
    if os.path.exists(os.path.join(frontend_path, "static")):
        app.mount("/static", StaticFiles(directory=os.path.join(frontend_path, "static")), name="static")
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
