from pydantic import BaseModel
from typing import List
import datetime

class UsuarioCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

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
        from_attributes = True

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