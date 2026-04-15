from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importando a base de dados
from database import engine, Base

# Importando os roteadores modulares
from routers import auth, medicamentos, vendas

# Cria as tabelas no banco de dados, caso não existam
Base.metadata.create_all(bind=engine)

# Inicializa o app
app = FastAPI(title="PharmaSys API", version="2.0")

# Configuração de CORS (Permite que o HTML/JS converse com o Python)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Conectando as rotas ao aplicativo principal
app.include_router(auth.router)
app.include_router(medicamentos.router)
app.include_router(vendas.router)

@app.get("/")
def root():
    return {"message": "API da Farmácia está online e modular!"}