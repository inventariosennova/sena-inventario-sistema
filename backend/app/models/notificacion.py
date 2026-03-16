from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from app.database.database import Base

class Notificacion(Base):
    __tablename__ = "notificaciones"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(50), nullable=False, index=True)  # sesion, cambio, alerta, info
    titulo = Column(String(255), nullable=False)
    mensaje = Column(Text, nullable=False)
    leida = Column(Boolean, default=False, index=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    usuario_email = Column(String(255), index=True, nullable=True)  # Si es para un usuario específico
