# 🎉 Eventus - Sistema de Gestão de Eventos

![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![H2](https://img.shields.io/badge/H2_Database-09476B?style=for-the-badge&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Bootstrap 5](https://img.shields.io/badge/Bootstrap_5-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)

> Aplicação web full-stack para gerenciamento e orquestração de eventos, desenvolvida com arquitetura Monorepo 100% conteinerizada via Docker.

---

## 📌 Sobre o Projeto

O **Eventus** é um sistema projetado para facilitar o cadastro, organização e acompanhamento de eventos. A aplicação combina uma interface moderna e reativa no frontend com uma API REST robusta e segura no backend, conectada a um banco de dados relacional.

---

## 🛠️ Tecnologias Utilizadas

### **Frontend**
* **React 19** + **TypeScript**
* **Vite** (Build tool)
* **Bootstrap 5** (Estilização e componentes)
* **Nginx** (Servidor web em produção/container)

### **Backend**
* **Java 21**
* **Spring Boot 3.3.4**
* **Spring Data JPA / Hibernate**
* **Spring Security**
* **Lombok**

### **Banco de Dados & Infraestrutura**
* **H2 Database** (arquivo local em `backend/data`)
* **Docker** & **Docker Compose**

---

## 📁 Estrutura do Monorepo

```text
Eventus/
├── backend/          # Aplicação Spring Boot (API REST)
├── frontend/         # Aplicação React + Vite (Interface)
├── docs/             # Documentação do projeto
│   └── servicos.md   # Rotas, portas, comandos e guia de execução
├── docker-compose.yml # Orquestração dos containers
└── README.md         # Apresentação principal do repositório
```

---

## 🚀 Como Executar

### Com Docker

```bash
cp .env.example .env
docker compose up --build
```

Frontend em http://localhost:3000, API em http://localhost:8080/api/v1/test.

### Sem Docker

Pré-requisitos: Java 21 e Node 20+. O banco H2 é criado automaticamente em `backend/data`, sem configuração adicional.

1. Backend:

```bash
cd backend
./mvnw spring-boot:run
```

2. Frontend (em outro terminal): crie `frontend/.env.local` com `VITE_API_URL=/api/v1`; o Vite encaminha `/api` para `localhost:8080`:

```bash
cd frontend
npm ci
npm run dev
```

Testes do backend (usam H2, sem necessidade de banco): `cd backend && ./mvnw test`.
