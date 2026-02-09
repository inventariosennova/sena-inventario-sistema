from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.database import get_db
from app.models.activo import Activo
import os
from pathlib import Path
import shutil
import uuid
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api", tags=["inventario"])

# Crear carpeta para uploads si no existe
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.get("/activos")
async def get_activos(
    placa: Optional[str] = None,
    consecutivo: Optional[str] = None,  # NUEVO PARÁMETRO
    responsable: Optional[str] = None,
    cedula: Optional[str] = None,  # NUEVO PARÁMETRO
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Activo)
    
    if placa:
        query = query.filter(Activo.placa.contains(placa))
    if consecutivo:  # NUEVO FILTRO
        query = query.filter(Activo.consecutivo.contains(consecutivo))
    if responsable:
        query = query.filter(Activo.responsable.contains(responsable))
    if cedula:  # NUEVO FILTRO
        query = query.filter(Activo.cedula_responsable.contains(cedula))
    
    activos = query.offset(skip).limit(limit).all()
    
    return {
        "total": query.count(),
        "activos": activos
    }

@router.get("/activos/{activo_id}")
async def get_activo(activo_id: int, db: Session = Depends(get_db)):
    activo = db.query(Activo).filter(Activo.id == activo_id).first()
    if not activo:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    return activo

@router.post("/activos")
async def create_activo(
    placa: str = Form(...),
    consecutivo: str = Form(""),  # NUEVO CAMPO
    descripcion: str = Form(...),
    modelo: str = Form(""),
    responsable: str = Form(...),
    cedula_responsable: str = Form(""),  # NUEVO CAMPO
    ubicacion: str = Form(""),
    imagenes: List[UploadFile] = File([]),
    db: Session = Depends(get_db)
):
    # Verificar si la placa ya existe
    existing = db.query(Activo).filter(Activo.placa == placa).first()
    if existing:
        raise HTTPException(status_code=400, detail="La placa ya existe")
    
    # Guardar imágenes localmente
    imagen_urls = []
    for imagen in imagenes:
        if imagen.filename:
            file_extension = Path(imagen.filename).suffix
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = UPLOAD_DIR / unique_filename
            
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(imagen.file, buffer)
            
            imagen_urls.append(f"/uploads/{unique_filename}")
    
    # Crear activo
    nuevo_activo = Activo(
        placa=placa,
        consecutivo=consecutivo,  # NUEVO CAMPO
        descripcion=descripcion,
        modelo=modelo,
        responsable=responsable,
        cedula_responsable=cedula_responsable,  # NUEVO CAMPO
        ubicacion=ubicacion,
        imagenes=imagen_urls
    )
    
    db.add(nuevo_activo)
    db.commit()
    db.refresh(nuevo_activo)
    
    return nuevo_activo

@router.put("/activos/{activo_id}")
async def update_activo(
    activo_id: int,
    placa: Optional[str] = Form(None),
    consecutivo: Optional[str] = Form(None),  # NUEVO CAMPO
    descripcion: Optional[str] = Form(None),
    modelo: Optional[str] = Form(None),
    responsable: Optional[str] = Form(None),
    cedula_responsable: Optional[str] = Form(None),  # NUEVO CAMPO
    ubicacion: Optional[str] = Form(None),
    imagenes: List[UploadFile] = File([]),
    db: Session = Depends(get_db)
):
    activo = db.query(Activo).filter(Activo.id == activo_id).first()
    if not activo:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    
    # Actualizar campos
    if placa: activo.placa = placa
    if consecutivo: activo.consecutivo = consecutivo  # NUEVO
    if descripcion: activo.descripcion = descripcion
    if modelo: activo.modelo = modelo
    if responsable: activo.responsable = responsable
    if cedula_responsable: activo.cedula_responsable = cedula_responsable  # NUEVO
    if ubicacion: activo.ubicacion = ubicacion
    
    # Guardar nuevas imágenes
    if imagenes and imagenes[0].filename:
        if not activo.imagenes:
            activo.imagenes = []
            
        for imagen in imagenes:
            file_extension = Path(imagen.filename).suffix
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = UPLOAD_DIR / unique_filename
            
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(imagen.file, buffer)
            
            activo.imagenes.append(f"/uploads/{unique_filename}")
    
    db.commit()
    db.refresh(activo)
    
    return activo

@router.delete("/activos/{activo_id}")
async def delete_activo(activo_id: int, db: Session = Depends(get_db)):
    activo = db.query(Activo).filter(Activo.id == activo_id).first()
    if not activo:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    
    db.delete(activo)
    db.commit()
    
    return {"message": "Activo eliminado exitosamente"}
