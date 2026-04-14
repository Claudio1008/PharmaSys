from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# ==========================================
# CONFIGURAÇÃO DO BANCO DE DADOS (MySQL)
# ==========================================
DATABASE_URL = "mysql+pymysql://root:@localhost:3306/farmacia"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependência para pegar a sessão do banco nas rotas
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()