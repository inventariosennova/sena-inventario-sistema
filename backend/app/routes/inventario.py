from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.database import get_db
from app.models.activo import Activo
from app.models.historial import HistorialCambio
import os
from pathlib import Path
import shutil
import uuid
from dotenv import load_dotenv
from fastapi.responses import StreamingResponse
import io
import pandas as pd
import json

load_dotenv()

router = APIRouter(prefix="/api", tags=["inventario"])

# Crear carpeta para uploads si no existe
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.get("/activos")
async def get_activos(
    placa: Optional[str] = None,
    responsable: Optional[str] = None,
    cedula: Optional[str] = None,
    ubicacion: Optional[str] = None,  # ✅ AGREGAR ESTE PARÁMETRO
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Activo)
    
    if placa:
        query = query.filter(Activo.placa.contains(placa))
    if responsable:
        query = query.filter(Activo.responsable.contains(responsable))
    if cedula:
        query = query.filter(Activo.cedula_responsable.contains(cedula))
    if ubicacion:  # ✅ AGREGAR ESTE FILTRO
        query = query.filter(Activo.ubicacion.contains(ubicacion))
    
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
    descripcion: str = Form(...),
    modelo: str = Form(""),
    responsable: str = Form(...),
    cedula_responsable: str = Form(""),
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
        descripcion=descripcion,
        modelo=modelo,
        responsable=responsable,
        cedula_responsable=cedula_responsable,
        ubicacion=ubicacion,
        imagenes=imagen_urls
    )
    
    db.add(nuevo_activo)
    db.commit()
    db.refresh(nuevo_activo)

    # Registrar historial de creación
    historial = HistorialCambio(
        activo_id=nuevo_activo.id,
        placa=placa,
        responsable=responsable,
        accion="creado",
        descripcion_cambio=f"Creación del activo con placa {placa}"
    )
    db.add(historial)
    db.commit()
    
    return nuevo_activo

@router.put("/activos/{activo_id}")
async def update_activo(
    activo_id: int,
    placa: Optional[str] = Form(None),
    descripcion: Optional[str] = Form(None),
    modelo: Optional[str] = Form(None),
    responsable: Optional[str] = Form(None),
    cedula_responsable: Optional[str] = Form(None),
    ubicacion: Optional[str] = Form(None),
    imagenes_existentes: Optional[str] = Form(None),  # JSON con URLs que se deben mantener
    imagenes: List[UploadFile] = File([]),
    db: Session = Depends(get_db)
):
    activo = db.query(Activo).filter(Activo.id == activo_id).first()
    if not activo:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    
    # Actualizar campos
    if placa: activo.placa = placa
    if descripcion: activo.descripcion = descripcion
    if modelo: activo.modelo = modelo
    if responsable: activo.responsable = responsable
    if cedula_responsable: activo.cedula_responsable = cedula_responsable
    if ubicacion: activo.ubicacion = ubicacion

    # Actualizar lista de imágenes existentes (mantener solo las recibidas)
    if imagenes_existentes is not None:
        try:
            import json
            urls_mantener = json.loads(imagenes_existentes)
            if not isinstance(urls_mantener, list):
                urls_mantener = []
        except Exception:
            urls_mantener = []
        activo.imagenes = urls_mantener
    elif not activo.imagenes:
        activo.imagenes = []

    cambios_descritos = "Actualización de activo"
    
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

    # Registrar historial de actualización
    historial = HistorialCambio(
        activo_id=activo.id,
        placa=activo.placa,
        responsable=activo.responsable,
        accion="actualizado",
        descripcion_cambio=cambios_descritos
    )
    db.add(historial)
    db.commit()
    
    return activo

@router.get("/activos/{activo_id}/historial")
async def get_historial_activo(activo_id: int, db: Session = Depends(get_db)):
    historial = (
        db.query(HistorialCambio)
        .filter(HistorialCambio.activo_id == activo_id)
        .order_by(HistorialCambio.fecha_cambio.desc())
        .all()
    )
    return historial

@router.get("/historial")
async def get_historial_general(db: Session = Depends(get_db)):
    historial = (
        db.query(HistorialCambio)
        .order_by(HistorialCambio.fecha_cambio.desc())
        .limit(500)
        .all()
    )
    return historial

@router.get("/exportar/excel")
async def exportar_excel(request: Request, db: Session = Depends(get_db)):
    activos = db.query(Activo).all()
    base_url = str(request.base_url).rstrip("/")
    data = []
    for a in activos:
        fecha_creacion = a.created_at.strftime("%Y-%m-%d %H:%M:%S") if a.created_at else ""
        # Construir URLs absolutas para las imágenes
        if a.imagenes:
            imagenes_urls = [f"{base_url}{path}" for path in a.imagenes]
            imagenes_str = "; ".join(imagenes_urls)
        else:
            imagenes_str = ""
        data.append({
            "Placa": a.placa,
            "Descripción": a.descripcion,
            "Modelo": a.modelo,
            "Responsable": a.responsable,
            "Cédula": a.cedula_responsable,
            "Ubicación": a.ubicacion,
            "Fecha Creación": fecha_creacion,
            "Imágenes": imagenes_str
        })
    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Activos")
    output.seek(0)

    headers = {
        "Content-Disposition": "attachment; filename=activos_sena.xlsx"
    }
    return StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers=headers)

@router.delete("/activos/{activo_id}")
async def delete_activo(activo_id: int, db: Session = Depends(get_db)):
    activo = db.query(Activo).filter(Activo.id == activo_id).first()
    if not activo:
        raise HTTPException(status_code=404, detail="Activo no encontrado")

    # Registrar historial de eliminación
    historial = HistorialCambio(
        activo_id=activo.id,
        placa=activo.placa,
        responsable=activo.responsable,
        accion="eliminado",
        descripcion_cambio=f"Eliminación del activo con placa {activo.placa}"
    )
    db.add(historial)
    db.delete(activo)
    db.commit()
    
    return {"message": "Activo eliminado exitosamente"}
