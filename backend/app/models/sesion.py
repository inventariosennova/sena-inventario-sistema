from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.database.database import Base

class SesionUsuario(Base):
    __tablename__ = "sesiones_usuarios"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    nombre = Column(String(255), nullable=False)
    fecha_ingreso = Column(DateTime(timezone=True), server_default=func.now())
    fecha_salida = Column(DateTime(timezone=True), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
