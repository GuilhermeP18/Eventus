# Plano de Testes — Eventus

**Issue:** `#12`  
**Escopo:** Estabilização — cobertura ponta a ponta separada entre **Backend** e **Frontend**, contemplando as 8 regras de negócio obrigatórias, os 6 cenários do fluxo de aceite mínimo, testes negativos (autorização e validações) e suíte automatizada.

---

## 1. Objetivo e Estratégia

Validar o sistema **Eventus** de forma abrangente nos dois lados da aplicação:

- **Backend (`backend/`):** suíte automatizada em JUnit 5 + Mockito + MockMvc no perfil `test` (`H2` em memória via `backend/src/test/resources/application-test.properties`), complementada por execução regressiva e negativa via HTTP contra `/api/v1`.
- **Frontend (`frontend/`):** validação estática (`eslint`), checagem de tipos e build (`tsc -b && vite build`), além de verificação funcional das rotas, guardas de autenticação, validações de formulário, tratamento de erros da API e aderência às telas do fluxo de aceite.
- **Rastreabilidade de defeitos:** divergências funcionais ou lacunas não são mascaradas nem alteradas silenciosamente em produção; ficam registradas em `docs/09-relatorio-e-evidencias.md` para abertura de Issues separadas.

---

## 2. Testes — Backend (`backend/`)

### 2.1 Módulos e Endpoints Cobertos

| Módulo | Endpoints | Escopo de Validação |
|--------|-----------|---------------------|
| **Saúde** | `GET /api/v1/test` | Disponibilidade pública (`status: UP`) |
| **Autenticação e Perfil** | `POST /api/v1/auth/cadastro`, `POST /api/v1/auth/login`, `GET/PUT /api/v1/auth/me` | Normalização de e-mail/CPF/UF/CEP, idade mínima (18 anos), hash BCrypt, bloqueio após 5 falhas (`429`), emissão de JWT e imutabilidade de e-mail/CPF na edição de perfil |
| **Dependentes** | `GET/POST /api/v1/dependentes` | Exigência de JWT, validação de `@NotBlank` e `@Past`, ordenação alfabética por nome e isolamento por responsável |
| **Eventos e Mídia** | `GET/POST /api/v1/eventos`, `GET/PUT /api/v1/eventos/{id}`, `GET/PUT /api/v1/eventos/{id}/imagem` | Listagem pública ordenada por data, validação de janela de inscrição e capacidade mínima, upload JPG/PNG/WEBP (até 2 MB) e preservação da capa na edição |
| **Inscrições** | `POST /api/v1/eventos/{id}/inscricoes`, `GET /api/v1/inscricoes/minhas` | Período de inscrição, controle de capacidade/lotação, unicidade por usuário no evento, código único `[A-Z0-9]{8}` e listagem restrita ao usuário logado |
| **Portaria / Check-in** | `GET /api/v1/portaria/busca`, `POST /api/v1/portaria/inscricoes/{id}/checkin` | Rejeição de busca vazia (`400`), consulta por código, CPF e nome, registro único de presença (`409` na repetição) e auditoria de check-in |
| **Dashboard** | Endpoints de métricas/indicadores por evento | Derivação de inscritos, cancelados, presentes e vagas restantes a partir dos registros persistidos |

### 2.2 Regras de Negócio Obrigatórias no Backend

| ID | Regra de Negócio | Casos de Teste |
|----|------------------|----------------|
| **RN-01** | Inscrição só ocorre dentro do período configurado e enquanto houver vagas. | `CT-BE-RN01-01`: dentro do prazo e com vaga -> `201 Created`; `CT-BE-RN01-02`: antes de `inscricaoInicio` ou após `inscricaoFim` -> `409 Conflict`; `CT-BE-RN01-03`: capacidade esgotada -> `409 Conflict` |
| **RN-02** | Um participante não pode ter duas inscrições ativas no mesmo evento com o mesmo e-mail. | `CT-BE-RN02-01`: mesma conta no mesmo evento -> `409 Conflict`; `CT-BE-RN02-02`: cadastro com e-mail duplicado (independente de caixa/espaços) -> `409 Conflict` |
| **RN-03** | Cancelamento antes do prazo limite libera a vaga novamente. | `CT-BE-RN03-01`: cancelar inscrição dentro do prazo -> libera vaga para nova inscrição; `CT-BE-RN03-02`: cancelar fora do prazo -> operação recusada |
| **RN-04** | Check-in só ocorre para inscrição confirmada. | `CT-BE-RN04-01`: check-in em inscrição confirmada -> `200 OK`; `CT-BE-RN04-02`: inscrição inexistente -> `404 Not Found`; inscrição cancelada/não confirmada -> bloqueio |
| **RN-05** | Cada inscrição permite no máximo um check-in. | `CT-BE-RN05-01`: 1º check-in -> `200 OK` (`presente = true`); `CT-BE-RN05-02`: 2º check-in -> `409 Conflict` (`"Entrada já registrada"`) |
| **RN-06** | Check-in registra data/hora e operador responsável. | `CT-BE-RN06-01`: resposta/registro de check-in deve conter timestamp e identificação do operador autenticado |
| **RN-07** | Evento encerrado não aceita novas inscrições nem alterações de capacidade sem ação administrativa registrada. | `CT-BE-RN07-01`: inscrição em evento encerrado -> bloqueada; `CT-BE-RN07-02`: edição de capacidade em evento encerrado -> bloqueada sem ação admin/auditoria |
| **RN-08** | Indicadores do dashboard devem derivar dos dados reais de inscrições e check-ins. | `CT-BE-RN08-01`: métricas retornadas pela API devem corresponder às contagens reais no banco |

### 2.3 Testes Negativos no Backend

| ID | Categoria | Alvo | Condição de Teste | Resultado Esperado |
|----|-----------|------|-------------------|--------------------|
| **NEG-BE-01** | Autenticação | Rotas protegidas | Requisição sem JWT ou com JWT inválido/expirado | `401 Unauthorized` |
| **NEG-BE-02** | Autorização por perfil | `POST/PUT /api/v1/eventos`, `/imagem` | Usuário comum (participante, não organizador) autenticado | `403 Forbidden` |
| **NEG-BE-03** | Autorização por perfil | `/api/v1/portaria/**` | Usuário comum (participante, não operador) autenticado | `403 Forbidden` |
| **NEG-BE-04** | Isolamento de dados | `GET /dependentes`, `GET /inscricoes/minhas` | Usuário `B` consultando após ações do usuário `A` | Retorna apenas dados de `B` |
| **NEG-BE-05** | Validação de cadastro | `POST /api/v1/auth/cadastro` | Menor de 18 anos, campos em branco, e-mail/CPF/CEP/UF/senha inválidos | `400 Bad Request` (`mensagem` ou mapa `campos`) |
| **NEG-BE-06** | Força bruta no login | `POST /api/v1/auth/login` | 5 senhas erradas seguidas e 6ª tentativa válida | 5x `401` e bloqueio `429 Too Many Requests` |
| **NEG-BE-07** | Validação de dependentes | `POST /api/v1/dependentes` | `nome` vazio ou `dataNascimento` futura (`@Past`) | `400 Bad Request` |
| **NEG-BE-08** | Validação de eventos/upload | `POST/PUT /eventos`, `/imagem` | `inscricaoFim <= inscricaoInicio`, `capacidade < 1`, imagem `image/gif` ou > 2 MB | `400 Bad Request` (ou `413` > 2 MB) |
| **NEG-BE-09** | Validação de busca | `GET /api/v1/portaria/busca` | Parâmetro `q` ausente ou só espaços | `400 Bad Request` |

### 2.4 Suíte Automatizada (`backend/src/test/`)

| Classe | Tipo | Escopo Principal |
|--------|------|------------------|
| `EventusApplicationTests` | Integração | Carga do contexto Spring Boot no perfil `test` |
| `ApiFluxoTest` | Integração (`MockMvc` + `H2`) | Fluxo contínuo encadeado de cadastro, login, dependentes, eventos, imagem, inscrições e portaria |
| `RegressaoApiTest` | Integração (`MockMvc` + `H2`) | Regressão independente por módulo (saúde, JWT/401, perfil, ordenação/upload de eventos, inscrições, portaria e dependentes) |
| `AuthServiceTest` | Unitário | Idade mínima, hash BCrypt e bloqueio por 5 tentativas |
| `DependenteServiceTest` | Unitário | Criação com trim, vínculo ao responsável, ordenação e usuário ausente (`401`) |
| `EventoServiceTest` | Unitário | Validação de datas, criação, edição preservando imagem e upload |
| `InscricaoServiceTest` | Unitário | Janela de inscrição, duplicidade, vagas e geração de código |
| `PortariaServiceTest` | Unitário | Busca por código/nome/CPF, termo vazio, check-in e duplicidade |

---

## 3. Testes — Frontend (`frontend/`)

### 3.1 Rotas, Guardas e Navegação

| Caso | Alvo | Condição | Resultado Esperado |
|------|------|----------|--------------------|
| **CT-FE-ROT-01** | Rotas públicas (`/`, `/login`, `/cadastro`, `/eventos/:id`) | Usuário não autenticado | Renderização sem redirecionamento; `Home` consulta `/test` e `/eventos` |
| **CT-FE-ROT-02** | `ProtectedRoute` (`/eventos/novo`, `/eventos/:id/editar`, `/meus-ingressos`, `/painel`, `/portaria`) | Usuário não autenticado | Redirecionamento imediato para `/login` |
| **CT-FE-ROT-03** | Restrição de UI por perfil | Participante comum autenticado | Ações administrativas (`Criar evento`, `Editar`, `/portaria`) não devem ficar liberadas a perfis sem permissão |
| **CT-FE-ROT-04** | `Navbar` e `MenuUsuario` | Usuário autenticado e não autenticado | Alternância entre `Entrar`/`Cadastrar` e `Criar evento` + avatar com iniciais, `Painel`, `Meus ingressos`, `Sair` e acesso à `Portaria` para operadores |
| **CT-FE-ROT-05** | `AuthProvider` | Token expirado/inválido no `localStorage` | Ao receber `401` em `GET /auth/me`, executa `logout()` limpando estado e `localStorage` |

### 3.2 Validações Client-Side e Tratamento de Erros de API

| Caso | Tela / Componente | Condição | Resultado Esperado |
|------|-------------------|----------|--------------------|
| **CT-FE-VAL-01** | `Cadastro.tsx` | Campos vazios, menor de 18 anos, senha < 8, CPF != 11 dígitos, CEP != 8 dígitos, UF != 2 letras | Bloqueio no submit com feedback por campo e mapeamento de erros `400` (`endereco.*`) / `409` |
| **CT-FE-VAL-02** | `Login.tsx` | E-mail inválido, senha vazia, `401` e `429` | Mensagens específicas na tela sem quebrar estado de envio |
| **CT-FE-VAL-03** | `DadosPessoais.tsx` | Campos de e-mail e CPF em `readOnly`; edição válida e inválida | E-mail/CPF não editáveis; atualização reflete o novo nome na `Navbar` |
| **CT-FE-VAL-04** | `FormularioEvento.tsx` | `capacidade < 1`, `inscricaoFim <= inscricaoInicio`, arquivo não JPG/PNG/WEBP ou > 2 MB | Mensagem de erro inline antes do envio e tratamento de `413` / `400` no upload |
| **CT-FE-VAL-05** | `Painel.tsx` (aba Dependentes) | Nome vazio ou `dataNascimento >= hoje` | Validação inline antes do `POST /dependentes` e ordenação da lista ao inserir |

### 3.3 Fluxos Funcionais de Interface (Inscrição, Portaria e Painel)

| Caso | Tela / Componente | Comportamento Esperado |
|------|-------------------|------------------------|
| **CT-FE-FLUX-01** | `EventoDetalhe.tsx` | Exibir capa, data, local, capacidade e janela de inscrição; permitir inscrição (redirecionando anônimo para `/login`), exibir código gerado ou erro da API (`409`) |
| **CT-FE-FLUX-02** | `MeusIngressos.tsx` / `CardIngresso.tsx` | Listar ingressos com código, badge `Presença confirmada` quando `presente = true`, estado vazio e ação de cancelamento antes do prazo (RN-03) |
| **CT-FE-FLUX-03** | `Portaria.tsx` / `LinhaPortaria.tsx` | Rejeitar busca vazia; listar resultados formatando CPF; confirmar check-in desabilitando botões durante requisição; tratar `409` atualizando status para `Presente` |
| **CT-FE-FLUX-04** | `Painel.tsx` | Exibir abas `Dependentes`, `Dados pessoais`, `Segurança` e indicadores reais do dashboard para organizadores (RN-08) |

### 3.4 Verificação Estática e Build

- `npm run lint` (`eslint .`): zero erros de lint nos arquivos `.ts`/`.tsx`.
- `npm run build` (`tsc -b && vite build`): checagem estrita de tipos TypeScript e geração do bundle de produção em `dist/`.

---

## 4. Fluxo de Aceite Mínimo Ponta a Ponta (6 Cenários Críticos)

| Cenário | Descrição | Verificação Backend | Verificação Frontend |
|---------|-----------|---------------------|----------------------|
| **CA-01** | Organizador publica evento com capacidade limitada | `POST /api/v1/eventos` com `capacidade = 1` -> `201` e presença em `GET /api/v1/eventos` | `NovoEvento.tsx` + `FormularioEvento.tsx` criam evento e exibem em `ListaEventos.tsx` / `EventoDetalhe.tsx` |
| **CA-02** | Participantes preenchem todas as vagas e excedente é bloqueado | 1ª inscrição -> `201`; inscrição excedente -> `409` (`"Evento sem vagas disponíveis"`) | `EventoDetalhe.tsx` exibe código para o inscrito e `ErrorMessage` com retorno `409` para excedente |
| **CA-03** | Cancelar uma inscrição e comprovar liberação de vaga | Endpoint de cancelamento altera/libera vaga permitindo nova inscrição | Botão/fluxo de cancelamento em `MeusIngressos.tsx` atualiza lista e libera inscrição em `EventoDetalhe.tsx` |
| **CA-04** | Operador localiza participante (nome, e-mail ou código) e realiza check-in | `GET /api/v1/portaria/busca?q=...` localiza por nome, e-mail e código; `POST .../checkin` -> `200` com data/hora e operador | `Portaria.tsx` busca e `LinhaPortaria.tsx` atualiza badge para `Presente` |
| **CA-05** | Impedir novo check-in para a mesma inscrição | 2º `POST .../checkin` -> `409` (`"Entrada já registrada"`) | `LinhaPortaria.tsx` oculta botão de entrada após `presente = true` e `Portaria.tsx` trata `409` |
| **CA-06** | Dashboard reflete inscritos, cancelados, presentes e vagas restantes | API de métricas reflete contagens reais do banco | Tela de dashboard exibe os 4 indicadores sincronizados com a API |
