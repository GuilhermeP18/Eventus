# Eventus: Sistema de Gestão de Eventos com Credenciamento

Projeto P03 da disciplina **Fábrica de Software** (Univille), orientado pelo Prof. Willian Sestito.

> Este README descreve o estado do código na branch `dev` (commit `0605458`). Tudo o que está aqui foi conferido nos arquivos do repositório. Itens planejados que ainda não existem no código aparecem marcados como **não implementado**.

---

## 1. Identificação

| Item | Descrição |
|---|---|
| **Nome** | Eventus |
| **Propósito** | Publicar eventos, receber inscrições gratuitas com código único e controlar a entrada dos participantes na portaria (credenciamento). |
| **Problema que resolve** | Organizar eventos com vagas limitadas sem planilhas: o sistema controla o período de inscrição, a capacidade, impede inscrição duplicada e impede que a mesma inscrição entre duas vezes. |
| **Público-alvo** | Pessoas que criam eventos (organizadores), pessoas que participam (participantes) e a equipe que faz a conferência na entrada (operadores de portaria). |
| **Tipo de aplicação** | Aplicação web *full-stack* em monorepo: API REST em Spring Boot e interface SPA em React, executadas em contêineres Docker. |
| **Equipe** | Henrique Gomes do Vale, Maiquel Robert Mafra Junior, Nicholas Henrique Miranda, João Vitor Moller, João Lucas Medeiros de Jesus, Eduardo Schwarz e Luis Guilherme. |

### Sobre os perfis de usuário

O sistema **não tem papéis cadastrados no banco**. Existe um único tipo de conta (`Usuario`), e qualquer usuário logado pode criar eventos e se inscrever. As diferenças de acesso são:

- **Visitante** (sem login): vê a lista e o detalhe dos eventos.
- **Usuário autenticado**: cria eventos, se inscreve, vê os próprios ingressos, gerencia dados pessoais, dependentes e senha.
- **Criador do evento**: é o usuário que criou o evento. Só ele pode editar o evento e trocar a imagem.
- **Operador de portaria**: é um usuário autenticado cujo `id` aparece na variável de ambiente `PORTARIA_OPERATOR_IDS`. Recebe a permissão `ROLE_OPERADOR` no momento da autenticação e passa a acessar a portaria.

---

## 2. Funcionalidades

### 2.1 Conta e autenticação

| Funcionalidade | Como funciona | Onde está |
|---|---|---|
| Cadastro | Nome, e-mail, telefone (opcional), CPF, data de nascimento, senha e endereço completo. O e-mail é gravado em minúsculas e o CPF e o CEP só com dígitos. | `POST /api/v1/auth/cadastro`, tela `/cadastro` |
| Idade mínima | Cadastro e edição de perfil exigem pelo menos 18 anos (`AuthService.IDADE_MINIMA`). | `AuthService.validarIdade` |
| E-mail e CPF únicos | Recusa com `409` se o e-mail ou o CPF já existirem. | `AuthService.cadastrar`, restrições `unique` em `Usuario` |
| Máscaras no formulário | CPF `000.000.000-00`, telefone `(00) 00000-0000`, CEP `00000-000`, UF em lista com as 27 siglas. Os erros aparecem depois que o campo perde o foco ou ao enviar. | `utils/mascaras.ts`, `utils/estados.ts`, `hooks/useErrosVisiveis.ts` |
| Login | Devolve um token JWT do tipo `Bearer`, válido por 60 minutos. A mensagem de erro não diz se foi o e-mail ou a senha. | `POST /api/v1/auth/login`, tela `/login` |
| Bloqueio por tentativas | 5 falhas seguidas no mesmo e-mail bloqueiam o login por 15 minutos (`429`). O controle fica em memória e é zerado ao reiniciar o backend. | `TentativasLoginService` |
| Perfil | Consulta e edição de nome, telefone, data de nascimento e endereço. E-mail e CPF não podem ser alterados. | `GET/PUT /api/v1/auth/me`, aba "Dados" do `/painel` |
| Troca de senha | Exige a senha atual, confirmação igual e nova senha diferente da atual (8 a 72 caracteres). | `PUT /api/v1/auth/me/senha`, aba "Segurança" do `/painel` |
| Sessão no navegador | O token e o e-mail ficam no `localStorage`. Ao abrir o site, o front chama `GET /auth/me`; se a resposta for `401`, faz logout. | `auth/AuthProvider.tsx` |

### 2.2 Dependentes

| Funcionalidade | Como funciona | Onde está |
|---|---|---|
| Cadastrar dependente | Nome e data de nascimento (no passado), vinculados ao usuário logado. | `POST /api/v1/dependentes`, aba "Dependentes" do `/painel` |
| Listar dependentes | Só os do usuário logado, em ordem alfabética. | `GET /api/v1/dependentes` |

> **Observação:** os dependentes são apenas cadastrados e listados. Eles **não participam** das inscrições, e não há edição nem exclusão.

### 2.3 Eventos

| Funcionalidade | Como funciona | Onde está |
|---|---|---|
| Listar eventos | Público, ordenado pela data do evento. Mostra título, data, local e imagem. | `GET /api/v1/eventos`, tela `/` |
| Detalhe do evento | Público. Mostra descrição, data, local, capacidade e período de inscrição. | `GET /api/v1/eventos/{id}`, tela `/eventos/:id` |
| Criar evento | Qualquer usuário logado. Campos: título, descrição, data, local, capacidade (mínimo 1), início e fim da inscrição. O fim precisa ser depois do início. | `POST /api/v1/eventos`, tela `/eventos/novo` |
| Editar evento | Só o criador. Outro usuário recebe `403` na API, não vê o botão Editar e é redirecionado ao abrir a URL de edição. | `PUT /api/v1/eventos/{id}`, tela `/eventos/:id/editar`, `utils/eventos.ts` |
| Imagem de capa | Opcional, só o criador envia. JPG, PNG ou WEBP, até 2 MB. Fica gravada no banco. | `PUT/GET /api/v1/eventos/{id}/imagem` |

### 2.4 Inscrições e ingressos

| Funcionalidade | Como funciona | Onde está |
|---|---|---|
| Inscrever-se | Gratuita. Gera um código de 8 caracteres (`A-Z` e `0-9`) único no sistema. | `POST /api/v1/eventos/{id}/inscricoes`, botão "Inscrever-se" |
| Período de inscrição | Fora do intervalo `inscricaoInicio` a `inscricaoFim`, a API responde `409`. | `InscricaoService.inscrever` |
| Capacidade | Quando o número de inscrições chega à capacidade, a API responde `409`. | `InscricaoService.inscrever` |
| Inscrição duplicada | O mesmo usuário não se inscreve duas vezes no mesmo evento (`409` e restrição única no banco). Na tela, quem já está inscrito vê "Ver ingresso" no lugar de "Inscrever-se". | `InscricaoService`, `Inscricao` (`UniqueConstraint`), `EventoDetalhe.tsx` |
| Meus ingressos | Lista as inscrições do usuário logado, da mais recente para a mais antiga, com código e situação de presença. | `GET /api/v1/inscricoes/minhas`, tela `/meus-ingressos` |

### 2.5 Portaria (credenciamento)

| Funcionalidade | Como funciona | Onde está |
|---|---|---|
| Acesso | Só usuários com `ROLE_OPERADOR`. O link "Portaria" só aparece na barra para operadores. | `SecurityConfig`, `Navbar.tsx` |
| Busca | Por código exato, CPF exato (com ou sem pontuação) ou parte do nome. Busca vazia é recusada com `400`. | `GET /api/v1/portaria/busca?q=`, tela `/portaria` |
| CPF mascarado | A resposta da portaria mostra só os dois últimos dígitos (`***.***.***-50`). | `PortariaInscricaoResponse` |
| Check-in | Marca a inscrição como presente. Uma segunda tentativa responde `409` ("Entrada já registrada"). | `POST /api/v1/portaria/inscricoes/{id}/checkin` |

### 2.6 Outros

| Funcionalidade | Onde está |
|---|---|
| Verificação de saúde da API (`status: UP`) e indicador "API online" na página inicial | `GET /api/v1/test`, `IndicadorApi.tsx` |
| Formato único de erro em JSON (`timestamp`, `status`, `erro`, `mensagem`, `campos`) | `GlobalExceptionHandler`, `ErroResponse` |
| Documentação Swagger/OpenAPI, ativa só no perfil `dev` | `OpenApiConfig`, `application-dev.properties` |

### 2.7 Previsto, mas não implementado

Estes itens aparecem no briefing, em `docs/07-regras-de-negocio.md`, no plano de testes ou no diagrama `docs/anexos/DER-Eventus.svg`, mas **não existem no código atual**:

- Cancelamento de inscrição e liberação da vaga.
- Registro de data/hora e do operador responsável no check-in (hoje só existe o campo `presente`).
- Bloqueio de alterações em evento encerrado.
- Painel de indicadores (inscritos, presentes, vagas restantes).
- Categorias de evento, histórico de alterações e tabela própria de check-in (presentes só no DER).
- Uso de PostgreSQL em produção, decidido na ADR `docs/06-banco-de-dados.md`. O `pom.xml` só tem o driver do H2.

---

## 3. Stack tecnológica

### 3.1 Backend (`backend/`)

| Tecnologia | Versão | Papel no projeto |
|---|---|---|
| Java | 21 | Linguagem do backend. |
| Spring Boot | 3.3.4 | Base da aplicação: servidor embutido, injeção de dependências e configuração. |
| Spring Web | (Boot 3.3.4) | Controllers REST em `/api/v1`. |
| Spring Data JPA / Hibernate | (Boot 3.3.4) | Mapeamento das entidades e repositórios. O esquema é criado e atualizado pelo Hibernate (`ddl-auto=update`). |
| Spring Security | (Boot 3.3.4) | Autenticação sem sessão (`STATELESS`), regras de acesso por rota e `ROLE_OPERADOR`. |
| Bean Validation | (Boot 3.3.4) | Validação dos DTOs com `@NotBlank`, `@Email`, `@Pattern`, `@Past`, `@Size` e `@Min`. |
| jjwt | 0.12.6 | Geração e validação do token JWT assinado com HMAC (chave em `JWT_SECRET`). |
| BCrypt | (Spring Security) | Hash das senhas. |
| springdoc-openapi | 2.6.0 | Swagger UI e especificação OpenAPI, ativos só no perfil `dev`. |
| H2 Database | (Boot 3.3.4) | Banco relacional em arquivo (`./data/eventus`), em modo de compatibilidade PostgreSQL. Nos testes, em memória. |
| Lombok | (Boot 3.3.4) | Geração de getters, setters e construtores nas entidades. |
| Maven Wrapper | — | Build e execução dos testes (`./mvnw`). |
| JUnit 5, Mockito, MockMvc | (spring-boot-starter-test) | Testes unitários dos services e testes de integração da API. |

### 3.2 Frontend (`frontend/`)

| Tecnologia | Versão | Papel no projeto |
|---|---|---|
| React | 19.2 | Biblioteca de interface. |
| TypeScript | 6.0 | Tipagem; os tipos em `src/types/` espelham os DTOs do backend. |
| Vite | 8.3 | Servidor de desenvolvimento (com proxy de `/api` para `localhost:8080`) e build de produção. |
| React Router | 7.18 | Rotas da SPA e proteção das páginas que exigem login. |
| Axios | 1.20 | Cliente HTTP, com interceptor que envia o token em `Authorization`. |
| Bootstrap | 5.3 | Grade, componentes e estilos, com tema próprio em `src/index.css`. |
| ESLint | 10.10 | Análise estática (com regras de React Hooks e React Refresh). |

### 3.3 Infraestrutura

| Tecnologia | Papel no projeto |
|---|---|
| Docker | Imagens multi-stage: o backend compila com JDK 21 e roda com JRE 21 como usuário sem privilégios; o frontend compila com Node 20 e é servido pelo Nginx. |
| Docker Compose | Sobe `backend` (porta 8080) e `frontend` (porta 3000), com rede própria e volume `h2_data` para o banco. |
| Nginx | Serve a SPA e encaminha `/api` para o backend dentro da rede do Compose. |
| GitHub Actions | `ci.yml` roda `./mvnw verify` no backend e `npm ci`, `lint` e `build` no frontend. `branch-name.yml` valida o nome das branches (`feature/`, `fix/`, `docs/` etc.). |

### 3.4 Serviços externos

O sistema **não usa serviços externos**: não há envio de e-mail, pagamento, armazenamento em nuvem nem APIs de terceiros. Tudo roda nos dois contêineres.

---

## 4. Como executar (resumo)

```bash
cp .env.example .env      # no Windows: copy .env.example .env
# edite .env e preencha JWT_SECRET com pelo menos 32 caracteres
docker compose up -d --build
```

- Frontend: http://localhost:3000
- API: http://localhost:8080/api/v1/test

Para dar acesso à portaria, preencha `PORTARIA_OPERATOR_IDS` no `.env` com os IDs dos usuários (por exemplo `1` ou `1,3`) e suba os contêineres de novo. O guia completo de instalação, variáveis e testes fica na Parte 5 (`docs/04-setup-e-operacao.md`).

---

## 5. Documentação

| Arquivo | Conteúdo |
|---|---|
| `docs/01-arquitetura.md` | Arquitetura, ciclo de vida da requisição e estrutura de diretórios. |
| `docs/02-dominio-e-dados.md` | Modelo de dados e regras de negócio (Parte 3). |
| `docs/03-api-e-interfaces.md` | Endpoints e telas (Parte 4). |
| `docs/04-setup-e-operacao.md` | Ambiente, testes e deploy (Parte 5). |
| `docs/10-servicos.md` | Serviços, portas e comandos do Docker. |
| `docs/07-regras-de-negocio.md` | Análise das regras RN001 a RN028 frente ao briefing. |
| `docs/06-banco-de-dados.md` | ADR sobre o banco de dados. |
| `docs/08-plano-de-testes.md` e `docs/09-relatorio-e-evidencias.md` | Plano de testes e relatório de evidências. |
