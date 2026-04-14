from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import sessionmaker, Session, declarative_base, relationship
from pydantic import BaseModel
from typing import List
import datetime

# ==========================================
# CONFIGURAÇÃO DO BANCO DE DADOS (MySQL)
# ==========================================
# ATENÇÃO: Se o seu MySQL tiver senha no usuário root, coloque depois dos dois pontos (ex: root:123456@localhost)
DATABASE_URL = "mysql+pymysql://root:@localhost:3306/farmacia"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ==========================================
# MODELOS (Tabelas do Banco de Dados)
# ==========================================
class MedicamentoDB(Base):
    __tablename__ = "medicamentos"
    id = Column(Integer, primary_key=True, index=True)
    # AQUI ESTÃO AS CORREÇÕES: Adicionado o limite de 255 caracteres para o MySQL
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

# Cria as tabelas se elas não existirem
Base.metadata.create_all(bind=engine)

# ==========================================
# SCHEMAS (Validação de Dados com Pydantic)
# ==========================================
class MedicamentoBase(BaseModel):
    nome: str
    fabricante: str
    preco: float
    estoque: int
    receita_obrigatoria: bool

class MedicamentoCreate(MedicamentoBase):
    pass

class MedicamentoResponse(MedicamentoBase):
    id: int
    class Config:
        from_attributes = True # Atualizado para Pydantic V2 (removeu o aviso)

class ItemVendaCreate(BaseModel):
    medicamento_id: int
    quantidade: int

class VendaCreate(BaseModel):
    itens: List[ItemVendaCreate]

class ItemVendaResponse(BaseModel):
    medicamento_id: int
    quantidade: int
    preco_unitario: float
    class Config:
        from_attributes = True

class VendaResponse(BaseModel):
    id: int
    data_venda: datetime.datetime
    total: float
    itens: List[ItemVendaResponse]
    class Config:
        from_attributes = True

# ==========================================
# INICIALIZAÇÃO DA API E CONFIGURAÇÃO CORS
# ==========================================
app = FastAPI(title="API - Sistema de Farmácia")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependência para pegar a sessão do banco
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# ROTAS DA API
# ==========================================

# --- ROTAS DE MEDICAMENTOS ---
@app.post("/medicamentos/", response_model=MedicamentoResponse, tags=["Medicamentos"])
def cadastrar_medicamento(med: MedicamentoCreate, db: Session = Depends(get_db)):
    db_med = MedicamentoDB(**med.model_dump()) # Usando model_dump para Pydantic V2
    db.add(db_med)
    db.commit()
    db.refresh(db_med)
    return db_med

@app.get("/medicamentos/", response_model=List[MedicamentoResponse], tags=["Medicamentos"])
def listar_medicamentos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(MedicamentoDB).offset(skip).limit(limit).all()

@app.get("/medicamentos/{med_id}", response_model=MedicamentoResponse, tags=["Medicamentos"])
def buscar_medicamento(med_id: int, db: Session = Depends(get_db)):
    db_med = db.query(MedicamentoDB).filter(MedicamentoDB.id == med_id).first()
    if db_med is None:
        raise HTTPException(status_code=404, detail="Medicamento não encontrado")
    return db_med

# --- ROTAS DE VENDAS ---
@app.post("/vendas/", tags=["Vendas"])
def realizar_venda(venda: VendaCreate, db: Session = Depends(get_db)):
    total_venda = 0.0
    novos_itens = []

    for item in venda.itens:
        db_med = db.query(MedicamentoDB).filter(MedicamentoDB.id == item.medicamento_id).first()
        if not db_med:
            raise HTTPException(status_code=404, detail=f"Medicamento ID {item.medicamento_id} não encontrado")
        
        if db_med.estoque < item.quantidade:
            raise HTTPException(status_code=400, detail=f"Estoque insuficiente para {db_med.nome}. Disponível: {db_med.estoque}")

        db_med.estoque -= item.quantidade
        subtotal = db_med.preco * item.quantidade
        total_venda += subtotal
        
        novos_itens.append({
            "medicamento_id": db_med.id,
            "quantidade": item.quantidade,
            "preco_unitario": db_med.preco
        })

    nova_venda = VendaDB(total=total_venda)
    db.add(nova_venda)
    db.commit()
    db.refresh(nova_venda)

    for item_data in novos_itens:
        novo_item = ItemVendaDB(venda_id=nova_venda.id, **item_data)
        db.add(novo_item)
    
    db.commit()

    return {"mensagem": "Venda realizada com sucesso!", "venda_id": nova_venda.id, "total": total_venda}

@app.get("/vendas/", response_model=List[VendaResponse], tags=["Vendas"])
def listar_vendas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(VendaDB).offset(skip).limit(limit).all()

