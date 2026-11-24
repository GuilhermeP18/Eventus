# Relatório de Execução e Evidências de QA — Eventus

**Issue:** `#12`  
**Data da execução:** 23/11/2026  
**Branch avaliada:** `test/issue-12-plano-testes-evidencias` (base `main` em `9cd8ec7`)  
**Ambiente:** Java `21.0.8`, Spring Boot `3.3.4`, H2 em memória (`application-test.properties` e instância isolada em `127.0.0.1:18080`), Node.js / Vite `8.3.4`.

---

## 1. Resumo Executivo

- **Backend (`backend/`):**
  - Suíte automatizada (`./mvnw -B verify`, perfil `test`): **45 testes executados, 0 falhas, 0 erros, 0 ignorados** (`BUILD SUCCESS`).
  - Execução regressiva/negativa via HTTP: fluxos implementados (saúde, cadastro/login/perfil, bloqueio após 5 tentativas, dependentes, eventos/upload, inscrições com janela/capacidade/duplicidade e check-in único) validados com êxito.
- **Frontend (`frontend/`):**
  - `npm run lint` e `npm run build` (`tsc -b && vite build`): **aprovados sem erros**.
  - Inspeção de rotas, guardas, validações e fluxos de tela: validações client-side e consumo dos endpoints existentes consistentes com a API; identificadas lacunas de navegação, segregação por perfil e telas/ações ainda não implementadas.
- **Resultado frente aos requisitos obrigatórios:** identificadas **7 divergências/lacunas no Backend** e **5 no Frontend** (nenhum código de produção foi alterado; os itens seguem listados na Seção 4 para abertura de Issues separadas).

---

## 2. Evidências — Backend (`backend/`)

### 2.1 Suíte Automatizada (`./mvnw -B verify`, perfil `test`)

| Classe | Testes | Falhas | Erros | Ignorados | Status |
|--------|--------|--------|-------|-----------|--------|
| `com.eventus.eventus.ApiFluxoTest` | 1 | 0 | 0 | 0 | Passou |
| `com.eventus.eventus.EventusApplicationTests` | 1 | 0 | 0 | 0 | Passou |
| `com.eventus.eventus.RegressaoApiTest` | 7 | 0 | 0 | 0 | Passou |
| `com.eventus.eventus.service.AuthServiceTest` | 6 | 0 | 0 | 0 | Passou |
| `com.eventus.eventus.service.DependenteServiceTest` | 5 | 0 | 0 | 0 | Passou |
| `com.eventus.eventus.service.EventoServiceTest` | 11 | 0 | 0 | 0 | Passou |
| `com.eventus.eventus.service.InscricaoServiceTest` | 7 | 0 | 0 | 0 | Passou |
| `com.eventus.eventus.service.PortariaServiceTest` | 7 | 0 | 0 | 0 | Passou |
| **Total** | **45** | **0** | **0** | **0** | **BUILD SUCCESS** |

Cobertura adicionada nesta branch:
- `DependenteServiceTest` (5 testes unitários): criação com trim e vínculo ao responsável, listagem ordenada por nome, lista vazia e recusa (`401`) para usuário do token inexistente.
- `RegressaoApiTest` (7 testes de integração ponta a ponta): saúde (`GET /api/v1/test`), exigência de JWT nas rotas protegidas (`401`), cadastro/login/edição de perfil preservando e-mail e CPF, ordenação e upload WEBP em eventos, janelas/capacidade/unicidade de inscrições + `/inscricoes/minhas`, busca por código/nome/CPF e check-in único na portaria, além de ordenação e isolamento em dependentes.

### 2.2 Regras de Negócio e Fluxo de Aceite na API (Execução HTTP Live)

Execução contra `eventus-0.0.1-SNAPSHOT.jar` com H2 em memória (`jdbc:h2:mem:qa_e2e;MODE=PostgreSQL`).

| Item | Cenário / Regra | Requisição Executada | Resultado Observado | Status |
|------|-----------------|----------------------|---------------------|--------|
| **RN-01 / CA-01** | Publicar evento com capacidade limitada (`1`) | `POST /api/v1/eventos` (autenticado) | `201 Created` (`id=1`) | **Passou** |
| **RN-01** | Inscrição fora do período configurado | `POST /api/v1/eventos/2/inscricoes` (período encerrado) | `409 Conflict` (`"Fora do período de inscrição deste evento"`) | **Passou** |
| **RN-01 / CA-02** | Preencher vaga e bloquear inscrição excedente | `P1` e `P2` em `POST /api/v1/eventos/1/inscricoes` | `P1`: `201 Created` (`codigo=1P7UT1FL`); `P2`: `409 Conflict` (`"Evento sem vagas disponíveis"`) | **Passou** |
| **RN-02** | Impedir inscrição duplicada no mesmo evento | Novo `POST /api/v1/eventos/1/inscricoes` com `P1` | `409 Conflict` (`"Você já está inscrito neste evento"`) | **Passou** |
| **RN-02** | Impedir cadastro com e-mail duplicado | `POST /api/v1/auth/cadastro` com `org@qa.com` | `409 Conflict` (`"E-mail ou CPF já cadastrado"`) | **Passou** |
| **RN-03 / CA-03** | Cancelamento antes do prazo liberando vaga | `DELETE /api/v1/inscricoes/1` e `POST /api/v1/inscricoes/1/cancelar` | `404 Not Found` (funcionalidade ausente em `InscricaoController`/`InscricaoService`) | **Não implementado** |
| **RN-04** | Check-in somente para inscrição confirmada | `POST /api/v1/portaria/inscricoes/1/checkin` e `.../999999/checkin` | Existente: `200 OK`; inexistente (`RegressaoApiTest` / `PortariaServiceTest`): `404 Not Found`. Entidade `Inscricao` não possui campo `status` | **Parcial** |
| **CA-04** | Localizar participante na portaria (nome, e-mail ou código) | `GET /api/v1/portaria/busca?q=...` | Código (`1P7UT1FL`): `200`; Nome (`Participante Um`): `200`; CPF (`222.222.222-22`): `200`; **E-mail (`p1@qa.com`): `200 []`** | **Falhou (Divergência)** |
| **RN-05 / CA-05** | Realizar check-in e bloquear repetição | `POST /api/v1/portaria/inscricoes/1/checkin` (1ª e 2ª vez) | 1ª vez: `200 OK` (`"presente":true`); 2ª vez: `409 Conflict` (`"Entrada já registrada"`) | **Passou** |
| **RN-06** | Registro de data/hora e operador no check-in | Inspeção de `PortariaInscricaoResponse`, `Inscricao.java` e `PortariaController.java` | JSON retorna apenas `id, codigo, presente, nome, cpf, eventoTitulo, eventoData`; não persiste timestamp nem operador | **Não implementado** |
| **RN-07** | Evento encerrado e alteração de capacidade | `PUT /api/v1/eventos/2` (evento passado, `capacidade` 5 -> 20 por `P1`) | `200 OK` sem bloqueio nem auditoria administrativa | **Falhou (Gap)** |
| **RN-08 / CA-06** | Indicadores do dashboard derivados do banco | `GET /api/v1/dashboard` e `GET /api/v1/eventos/1/dashboard` | `404 Not Found` (sem controller/serviço de métricas) | **Não implementado** |

### 2.3 Testes Negativos na API

| Caso | Cenário Executado | Esperado | Observado | Status |
|------|-------------------|----------|-----------|--------|
| **NEG-BE-01** | Endpoints protegidos sem token / com JWT inválido | `401 Unauthorized` | `401 Unauthorized` nas rotas protegidas por `SecurityConfig` e em `GET /auth/me`. Em `PUT /auth/me` anônimo com `{}` retornou `400` antes de `401`, porque `/api/v1/auth/**` está `permitAll()` e `@Valid` executa antes de `emailLogado(auth)` | **Parcial (Bug em `/auth/me`)** |
| **NEG-BE-02** | Participante comum (`p1@qa.com`) cria evento (`POST /api/v1/eventos`) | `403 Forbidden` | `201 Created` (`Usuario` sem perfil/role e `SecurityConfig` sem restrição por papel) | **Falhou (Bug de segurança)** |
| **NEG-BE-03** | Participante comum (`p2@qa.com`) consulta portaria e registra check-in | `403 Forbidden` | `200 OK` na busca (expondo CPF de `P1`) e `200 OK` no check-in | **Falhou (Bug de segurança)** |
| **NEG-BE-04** | Isolamento de dependentes e inscrições entre `P1`, `P2` e `P3` | Listas isoladas por usuário | `P2` recebe `[]` em `/dependentes`; `P3` recebe `[]` em `/inscricoes/minhas` | **Passou** |
| **NEG-BE-05** | Cadastro de menor (`2010-01-01`) e cadastro com campos inválidos | `400 Bad Request` | `400` (`"É necessário ter pelo menos 18 anos"`) e `400` (`"Dados inválidos"` com mapa `campos`) | **Passou** |
| **NEG-BE-06** | 5 falhas de login + 6ª tentativa com senha válida | 5x `401` e 6ª `429` | `401,401,401,401,401` e `429 Too Many Requests` (`"... 15 minuto(s)"`) | **Passou** |
| **NEG-BE-07** | Dependente com data futura (`2030-01-01`) ou nome em branco | `400 Bad Request` | `400 Bad Request` | **Passou** |
| **NEG-BE-08** | Evento com `inscricaoFim < inscricaoInicio`, `capacidade = 0` e upload `image/gif` | `400 Bad Request` | Todos retornaram `400 Bad Request` | **Passou** |
| **NEG-BE-09** | `GET /api/v1/portaria/busca?q= ` (espaços) | `400 Bad Request` | `400 Bad Request` (`"Informe um código, nome ou CPF para buscar"`) | **Passou** |

---

## 3. Evidências — Frontend (`frontend/`)

### 3.1 Qualidade Estática e Build

| Verificação | Comando | Resultado | Saída / Observação |
|-------------|---------|-----------|--------------------|
| Lint (ESLint) | `npm run lint` (`eslint .`) | **Passou** | Código de saída `0`, sem erros ou warnings |
| Tipagem + Bundle | `npm run build` (`tsc -b && vite build`) | **Passou** | Código de saída `0`, 116 módulos compilados em `dist/` (`index.html`, CSS e JS) |

### 3.2 Verificação Funcional de Rotas, Validações e Telas

Análise estática e conferência de contrato dos componentes React frente aos requisitos e endpoints da API:

| Caso | Arquivo / Tela | Comportamento Verificado | Status |
|------|----------------|--------------------------|--------|
| **CT-FE-ROT-01 / 02** | `App.tsx`, `ProtectedRoute.tsx` | Rotas públicas (`/`, `/login`, `/cadastro`, `/eventos/:id`) separadas das rotas protegidas (`/eventos/novo`, `/eventos/:id/editar`, `/meus-ingressos`, `/painel`, `/portaria`), com redirecionamento para `/login` quando `isAuthenticated` é falso | **Passou** |
| **CT-FE-ROT-03** | `ProtectedRoute.tsx`, `Navbar.tsx`, `EventoDetalhe.tsx` | Não há validação de perfil/role no frontend: qualquer usuário logado vê `Criar evento` na `Navbar`, vê o botão `Editar` em `EventoDetalhe.tsx` e acessa `/eventos/novo`, `/eventos/:id/editar` e `/portaria` | **Falhou (Gap de perfil)** |
| **CT-FE-ROT-04** | `Navbar.tsx`, `MenuUsuario.tsx` | `MenuUsuario` exibe iniciais, nome, e-mail, `Painel`, `Meus ingressos` e `Sair`, porém **não possui link de navegação para `/portaria`** (acesso apenas digitando a URL manualmente) | **Divergência** |
| **CT-FE-ROT-05** | `AuthProvider.tsx`, `http.ts` | Interceptor injeta `Authorization: Bearer`; se `GET /auth/me` retornar `401`, `logout()` limpa token e usuário do `localStorage` | **Passou** |
| **CT-FE-VAL-01 a 05** | `Cadastro.tsx`, `Login.tsx`, `DadosPessoais.tsx`, `FormularioEvento.tsx`, `Painel.tsx` | Validações client-side (18 anos, CPF 11 dígitos, CEP 8 dígitos, UF 2 letras, senha >= 8, `inscricaoFim > inscricaoInicio`, `capacidade >= 1`, upload JPG/PNG/WEBP <= 2 MB, dependente `@Past`) e tratamento de erros `400`/`401`/`409`/`413`/`429` implementados | **Passou** |
| **CT-FE-FLUX-01** | `EventoDetalhe.tsx`, `ListaEventos.tsx` | Lista eventos, detalha dados, redireciona anônimo para `/login` ao tentar se inscrever e exibe código da inscrição ou erro `409` da API; não exibe vagas restantes | **Passou (sem vagas restantes)** |
| **CT-FE-FLUX-02** | `MeusIngressos.tsx`, `CardIngresso.tsx` | Lista inscrições do usuário com código e badge `Presença confirmada`; não possui botão/fluxo de cancelamento de inscrição (RN-03 / CA-03) | **Não implementado** |
| **CT-FE-FLUX-03** | `Portaria.tsx`, `LinhaPortaria.tsx` | Bloqueia busca vazia, formata CPF, desabilita botões durante check-in, trata `409` atualizando linha para `Presente`, mas placeholder indica `"Código, nome ou CPF"` (sem e-mail) e tabela não exibe data/hora/operador do check-in | **Parcial (CA-04 / RN-06)** |
| **CT-FE-FLUX-04** | `Painel.tsx` | Possui abas `Dependentes`, `Dados pessoais` e `Segurança` (`"Em breve"`); não possui dashboard nem indicadores reais (RN-08 / CA-06) | **Não implementado** |

---

## 4. Defeitos e Lacunas para Reporte em Issues Separadas

Nenhuma alteração foi aplicada no código de produção nesta branch. Itens recomendados para abertura de Issues específicas:

### Backend
1. **Segregação de acesso por perfil (`403 Forbidden`) ausente (`SecurityConfig` / `Usuario` / `JwtAuthenticationFilter`):** qualquer usuário autenticado cria/edita eventos, busca participantes/CPF na portaria e realiza check-in.
2. **Proteção de `PUT /api/v1/auth/me` na `SecurityConfig`:** `/api/v1/auth/**` está configurado como `permitAll()`, fazendo requisição anônima inválida receber `400` (`@Valid`) antes da checagem de autenticação (`401`).
3. **Busca na portaria não contempla e-mail (`InscricaoRepository.buscarParaPortaria`):** consulta atual filtra apenas `codigo`, `cpf` e `nome`.
4. **Cancelamento de inscrição e liberação de vaga não implementados (RN-03 / CA-03).**
5. **Auditoria de data/hora e operador no check-in ausente (RN-06):** `Inscricao` e `PortariaInscricaoResponse` não registram timestamp nem operador (`PortariaController.checkin` não recebe `Authentication`).
6. **Proteção de evento encerrado para alteração de capacidade (RN-07):** `EventoService.atualizar` aceita edição de capacidade em evento passado sem bloqueio nem registro administrativo.
7. **Endpoints de dashboard com indicadores reais não implementados (RN-08 / CA-06).**

### Frontend
1. **Ausência de guarda e controle de interface por perfil (`ProtectedRoute.tsx`, `Navbar.tsx`, `EventoDetalhe.tsx`):** rotas e botões de criação/edição de eventos e portaria estão expostos para qualquer usuário autenticado.
2. **Falta de link de navegação para `/portaria` (`MenuUsuario.tsx` / `Navbar.tsx`).**
3. **Tela de ingressos sem ação de cancelamento (RN-03 / CA-03) em `MeusIngressos.tsx` / `CardIngresso.tsx`.**
4. **Portaria sem exibição de data/hora e operador do check-in (RN-06) e com rótulo restrito a código/nome/CPF (CA-04) em `Portaria.tsx` / `LinhaPortaria.tsx`.**
5. **Dashboard de indicadores reais ausente no `Painel.tsx` (RN-08 / CA-06) e aba `Segurança` apenas com placeholder `"Em breve"`.**
