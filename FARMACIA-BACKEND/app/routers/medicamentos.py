from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import MedicamentoDB
from schemas import MedicamentoCreate, MedicamentoResponse
from routers.auth import obter_usuario_logado

router = APIRouter(prefix="/medicamentos", tags=["Medicamentos"])

@router.get("/", response_model=List[MedicamentoResponse])
def listar_medicamentos(db: Session = Depends(get_db), usuario=Depends(obter_usuario_logado)):
    return db.query(MedicamentoDB).all()

@router.post("/", response_model=MedicamentoResponse)
def criar_medicamento(med: MedicamentoCreate, db: Session = Depends(get_db), usuario=Depends(obter_usuario_logado)):
    novo_med = MedicamentoDB(**med.model_dump())
    db.add(novo_med)
    db.commit()
    db.refresh(novo_med)
    return novo_med