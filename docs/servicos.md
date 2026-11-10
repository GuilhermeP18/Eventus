# 🛠️ Arquitetura de Serviços - Eventus

Documentação dos serviços, rotas de acesso e instruções de infraestrutura do ecossistema **Eventus** rodando em containers via **Docker Compose**.

---

## 🚀 Tabela de Serviços e Portas

| Serviço | URL / Endereço | Porta (Host) | Descrição / Responsabilidade |
| :--- | :--- | :--- | :--- |
| **Frontend** | [http://localhost:3000](http://localhost:3000) | `3000` | Interface visual SPA em **React + TypeScript + Bootstrap 5**, servida via Nginx. |
| **Backend API** | [http://localhost:8080/api/v1/test](http://localhost:8080/api/v1/test) | `8080` | API REST em **Spring Boot 3 + Java 21** com Spring Security. |
| **Frontend de trabalho** | [http://localhost:5173](http://localhost:5173) | `5173` | Protótipo React/TanStack executado com Vite; proxy `/api` para o backend em desenvolvimento. |
| **Banco de Dados** | Arquivo `backend/data/eventus` | — | Banco **H2** em arquivo, embutido no backend (sem container próprio). |

---

## 🗄️ Credenciais do Banco de Dados

Não há credenciais de banco a configurar: o H2 é de uso estritamente local, com usuário `sa` e senha vazia. Os dados ficam no arquivo `backend/data/eventus` (ou `/app/data` dentro do container, persistido no volume `h2_data`).

---

## 📌 Rotas da API (Backend)

| Método | Endpoint | Acesso | Descrição |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/v1/test` | Público | Endpoint de verificação de status (*Health Check*) da API. |
| `POST` | `/api/v1/auth/register` | Público | Cria conta, valida CPF/e-mail e exige responsável adulto já cadastrado para menores de 18 anos. |
| `POST` | `/api/v1/auth/login` | Público | Autentica e inicia sessão HTTP; 5 falhas bloqueiam o e-mail por 15 minutos. |
| `GET` | `/api/v1/auth/me` | Sessão | Retorna o usuário autenticado e se pode organizar eventos (18 anos ou mais). |
| `POST` | `/api/v1/auth/logout` | Sessão | Encerra a sessão autenticada. |

---

As senhas são armazenadas com BCrypt. A sessão usa cookie HttpOnly e SameSite=Lax. Para servir a aplicação atrás de HTTPS, configure `SESSION_COOKIE_SECURE=true`. A verificação de e-mail está adiada; contas recém-criadas ficam ativas até a integração com um serviço de e-mail.

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

Listar o arquivo do banco H2 dentro do container do backend:
```bash
docker compose exec backend ls -la /app/data
```

Parar e remover todos os serviços:
```bash
docker compose down
```