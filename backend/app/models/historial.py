from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database.database import Base

class HistorialCambio(Base):
    __tablename__ = "historial_cambios"

    id = Column(Integer, primary_key=True, index=True)
    activo_id = Column(Integer, ForeignKey("activos.id"), nullable=False, index=True)
    placa = Column(String(100), nullable=True, index=True)
    responsable = Column(String(200), nullable=False)
    accion = Column(String(50), nullable=False)  # creado, actualizado, eliminado
    descripcion_cambio = Column(Text, nullable=False)
    fecha_cambio = Column(DateTime(timezone=True), server_default=func.now())
