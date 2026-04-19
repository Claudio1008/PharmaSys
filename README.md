# 💊 PharmaSys API

Uma API RESTful desenvolvida em **Python** com **FastAPI** para o gerenciamento de uma farmácia. Este projeto tem como objetivo principal controlar o estoque de medicamentos, registrar vendas e gerenciar acessos de forma segura e eficiente.

---

## 🚀 Funcionalidades

A API foi dividida em rotas modulares para facilitar a manutenção e escalabilidade:

* **🔐 Autenticação (`/auth`)**
  * Criação de usuários.
  * Geração de tokens de acesso seguros (JWT).
* **📦 Medicamentos (`/medicamentos`)**
  * Cadastro de novos medicamentos informando: nome, fabricante, preço, quantidade em estoque e se exige receita médica.
  * Listagem e consulta de medicamentos disponíveis.
* **🛒 Vendas (`/vendas`)**
  * Registro de novas vendas contendo múltiplos itens.
  * Cálculo automático do valor total da venda com base no preço unitário de cada medicamento.
  * Baixa automática no estoque após a confirmação da venda.

---

## 🛠️ Tecnologias e Bibliotecas

* **[FastAPI](https://fastapi.tiangolo.com/):** Framework web moderno e de alta performance.
* **[SQLAlchemy](https://www.sqlalchemy.org/):** ORM utilizado para modelagem e consultas ao banco de dados.
* **[Pydantic](https://docs.pydantic.dev/):** Validação estrita de dados de entrada e saída (Schemas).
* **[Uvicorn](https://www.uvicorn.org/):** Servidor ASGI para rodar a aplicação.
* **Bancos de Dados Suportados:** Configurado para rodar perfeitamente com **MySQL** (via PyMySQL) ou **SQLite** local.

---

## 📁 Estrutura do Projeto

O código-fonte foi organizado seguindo boas práticas, separando o ambiente de configuração da regra de negócios:

```text
pharma_sys/
├── app/                  # Diretório principal da aplicação
│   ├── routers/          # Endpoints da API separados por domínio
│   │   ├── auth.py
│   │   ├── medicamentos.py
│   │   └── vendas.py
│   ├── database.py       # Configuração da engine do banco de dados
│   ├── main.py           # Ponto de entrada do FastAPI e CORS
│   ├── models.py         # Modelos das tabelas do banco (SQLAlchemy)
│   └── schemas.py        # Validação de dados (Pydantic)
├── .env.example          # Exemplo de variáveis de ambiente seguras
├── .gitignore            # Arquivos ignorados pelo Git (.env, .db, venv)
└── README.md             # Documentação do projeto
