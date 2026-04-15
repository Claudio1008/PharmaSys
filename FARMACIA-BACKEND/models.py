from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
import datetime
from database import Base

class UsuarioDB(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    hashed_password = Column(String(255))

class MedicamentoDB(Base):
    __tablename__ = "medicamentos"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), index=True)
    fabricante = Column(String(255))
    preco = Column(Float)
    estoque = Column(Integer)
    receita_obrigatoria = Column(Integer)

class VendaDB(Base):
    __tablename__ = "vendas"
    id = Column(Integer, primary_key=True, index=True)
    data_venda = Column(DateTime, default=datetime.datetime.utcnow)
    total = Column(Float)
    itens = relationship("ItemVendaDB", back_populates="venda")

class ItemVendaDB(Base):
    __tablename__ = "itens_venda"
    id = Column(Integer, primary_key=True, index=True)
    venda_id = Column(Integer, ForeignKey("vendas.id"))
    medicamento_id = Column(Integer, ForeignKey("medicamentos.id"))
    quantidade = Column(Integer)
    preco_unitario = Column(Float)
    venda = relationship("VendaDB", back_populates="itens")