from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.database.database import Base

class Activo(Base):
    __tablename__ = "activos"
    
    id = Column(Integer, primary_key=True, index=True)
    placa = Column(String(100), unique=True, index=True, nullable=False)
    descripcion = Column(Text, nullable=False)
    modelo = Column(String(200))
    responsable = Column(String(200), nullable=False)
    cedula_responsable = Column(String(20), index=True, nullable=True)  # NUEVO CAMPO
    ubicacion = Column(String(300))
    imagenes = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
