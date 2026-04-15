from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import VendaDB, ItemVendaDB, MedicamentoDB
from schemas import VendaCreate, VendaResponse
from routers.auth import obter_usuario_logado

router = APIRouter(prefix="/vendas", tags=["Vendas"])

@router.get("/", response_model=List[VendaResponse])
def listar_vendas(db: Session = Depends(get_db), usuario=Depends(obter_usuario_logado)):
    return db.query(VendaDB).all()

@router.post("/", response_model=VendaResponse)
def realizar_venda(venda: VendaCreate, db: Session = Depends(get_db), usuario=Depends(obter_usuario_logado)):
    total_venda = 0.0
    novos_itens = []

    for item in venda.itens:
        db_med = db.query(MedicamentoDB).filter(MedicamentoDB.id == item.medicamento_id).first()
        if not db_med:
            raise HTTPException(status_code=404, detail=f"Medicamento {item.medicamento_id} não encontrado")
        if db_med.estoque < item.quantidade:
            raise HTTPException(status_code=400, detail=f"Estoque insuficiente para {db_med.nome}")

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
    db.refresh(nova_venda)
    return nova_venda