# 🛠️ Arquitetura de Serviços - Eventus

Documentação dos serviços, rotas de acesso e instruções de infraestrutura do ecossistema **Eventus** rodando em containers via **Docker Compose**.

---

## 🚀 Tabela de Serviços e Portas

| Serviço | URL / Endereço | Porta (Host) | Descrição / Responsabilidade |
| :--- | :--- | :--- | :--- |
| **Frontend** | [http://localhost:3000](http://localhost:3000) | `3000` | Interface visual SPA em **React + TypeScript + Bootstrap 5**, servida via Nginx. |
| **Backend API** | [http://localhost:8080/api/v1/test](http://localhost:8080/api/v1/test) | `8080` | API REST em **Spring Boot 3 + Java 21** com Spring Security. |
| **Banco de Dados** | `localhost:5432` | `5432` | Banco de dados relacional **PostgreSQL 16**. |

---

## 🗄️ Credenciais do Banco de Dados (PostgreSQL)

Copie `.env.example` para `.env` e ajuste os valores antes de subir os containers. Para conexões locais via SGBD (DBeaver, DataGrip, VS Code ou IntelliJ):

* **Host:** `localhost`
* **Porta:** `5432`
* **Database (Banco):** valor de `POSTGRES_DB` no `.env`
* **Usuário:** valor de `POSTGRES_USER` no `.env`
* **Senha:** valor de `POSTGRES_PASSWORD` no `.env`
* **Driver JDBC:** `org.postgresql.Driver`

---

## 📌 Rotas da API (Backend)

| Método | Endpoint | Acesso | Descrição |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/v1/test` | Público | Endpoint de verificação de status (*Health Check*) da API. |

---

## 🚀 Como Executar o Projeto

### 1. Primeira Execução (ou subir todos os serviços)
Na raiz do projeto (`Eventus/`), execute o comando para compilar as imagens e iniciar os containers em segundo plano:

```bash
docker compose up --build -d
```

---

## 🔄 Como Atualizar o Código e Aplicar Mudanças

### Opção A: Atualizar o Backend (Spring Boot)
Após alterar classes, rotas ou configurações no Java:

```bash
# Reconstruir apenas o container do backend e reiniciar
docker compose build backend
docker compose up -d backend
```

### Opção B: Atualizar o Frontend (React / TypeScript)
Após alterar componentes, estilos ou telas no React:

```bash
# Reconstruir apenas o container do frontend e reiniciar
docker compose build frontend
docker compose up -d frontend
```

### Opção C: Atualizar Tudo de Uma Vez
Caso tenha feito alterações tanto no backend quanto no frontend:

```bash
docker compose build
docker compose up -d
```

---

## 🛠️ Comandos Úteis de Monitoramento e Manutenção

Verificar o status e a saúde dos containers:
```bash
docker compose ps
```

Acompanhar os logs do backend em tempo real:
```bash
docker compose logs -f backend
```

Acompanhar os logs do frontend em tempo real:
```bash
docker compose logs -f frontend
```

Acessar o terminal do banco de dados PostgreSQL:
```bash
docker exec -it eventus-postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Parar e remover todos os serviços:
```bash
docker compose down
```