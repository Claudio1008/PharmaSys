from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta

from database import get_db
from models import UsuarioDB
from schemas import UsuarioCreate, Token

router = APIRouter(tags=["Autenticação"])

SECRET_KEY = "sua_chave_secreta_super_segura_aqui"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def verificar_senha(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def gerar_hash_senha(password):
    return pwd_context.hash(password)

def criar_token_acesso(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def obter_usuario_logado(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    usuario = db.query(UsuarioDB).filter(UsuarioDB.username == username).first()
    if usuario is None:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    return usuario

@router.post("/registrar", response_model=dict)
def registrar_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    usuario_existente = db.query(UsuarioDB).filter(UsuarioDB.username == usuario.username).first()
    if usuario_existente:
        raise HTTPException(status_code=400, detail="Usuário já existe")
    
    novo_usuario = UsuarioDB(username=usuario.username, hashed_password=gerar_hash_senha(usuario.password))
    db.add(novo_usuario)
    db.commit()
    return {"msg": "Usuário criado com sucesso!"}

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = db.query(UsuarioDB).filter(UsuarioDB.username == form_data.username).first()
    if not usuario or not verificar_senha(form_data.password, usuario.hashed_password):
        raise HTTPException(status_code=400, detail="Usuário ou senha incorretos")
    
    token = criar_token_acesso(data={"sub": usuario.username})
    return {"access_token": token, "token_type": "bearer"}