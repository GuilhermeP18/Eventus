# Parte 5: Setup e Operação

> Estado conferido na branch `docs/documentacao-tecnica`. Fontes: `.env.example`, `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf`, `backend/src/main/resources/application*.properties`, `backend/pom.xml`, `frontend/package.json`, `frontend/vite.config.ts`, `.github/workflows/` e as pastas `backend/src/test`.
>
> Nada foi executado para escrever este documento (nem Docker, nem Maven, nem npm). Onde um comportamento vem da leitura do código ou do comportamento conhecido de uma biblioteca, e não de uma execução, o texto diz **não confirmado em execução**.

## 1. Pré-requisitos

| Ferramenta | Docker | Sem Docker | Versão |
|---|---|---|---|
| Docker e Docker Compose (`docker compose`) | Sim | Não | Não há versão exigida no repositório. |
| Java (JDK) | Não (a imagem de build já traz o JDK) | Sim, para o backend | **21** (`java.version` no `pom.xml`; imagens `eclipse-temurin:21` no Dockerfile; `java-version: 21` no CI) |
| Maven | Não | Não precisa instalar: o projeto traz o **Maven Wrapper** (`backend/mvnw` e `mvnw.cmd`) | Wrapper 3.3.4, que baixa o Maven **3.9.16** (`.mvn/wrapper/maven-wrapper.properties`). A primeira execução precisa de internet. |
| Node.js e npm | Não (a imagem de build já traz o Node) | Sim, para o frontend | Dockerfile e CI usam **Node 20**. O `package.json` não define `engines`, então não há versão mínima declarada. |
| Git | Para clonar | Para clonar | — |

Versões principais do backend (`pom.xml`): Spring Boot **3.3.4**, jjwt **0.12.6**, springdoc **2.6.0**, banco H2 (versão gerenciada pelo Spring Boot).

---

## 2. Variáveis de ambiente

### 2.1 Tabela de variáveis

| Variável | Usada em | Obrigatória | Exemplo | O que faz |
|---|---|---|---|---|
| `JWT_SECRET` | Compose e backend (`app.jwt.secret`) | **Sim** | Texto aleatório com 32 caracteres ou mais | Chave de assinatura (HMAC) dos tokens JWT. |
| `PORTARIA_OPERATOR_IDS` | Compose e backend (`app.portaria.operator-ids`) | Não (padrão: vazio) | `1` ou `1,3` | Lista de ids de usuário com permissão de operador da portaria (`ROLE_OPERADOR`). |
| `VITE_API_URL` | Compose (argumento de build) e frontend (`api/http.ts`) | Com Docker: não (padrão `/api/v1`). Sem Docker: **sim, na prática** (ver 2.3) | `/api/v1` | URL base usada pelo Axios para chamar a API. |
| `SPRING_PROFILES_ACTIVE` | Backend (padrão do Spring) | Não | `dev` | Ativa o perfil `dev` (liga o Swagger). O Compose **não** repassa essa variável. |

Valores do `.env.example`: `VITE_API_URL=/api/v1`, `JWT_SECRET=` (vazio) e `PORTARIA_OPERATOR_IDS=` (vazio).

### 2.2 Relação entre `.env.example`, `.env` e o `docker-compose.yml`

| Arquivo | Papel |
|---|---|
| `.env.example` | Modelo versionado, com as três variáveis e sem segredo. |
| `.env` | Cópia local preenchida. **Está no `.gitignore`**, então não vai para o repositório. O Docker Compose lê o `.env` da raiz automaticamente. |
| `docker-compose.yml` | Usa os valores do `.env` por substituição. Não monta o `.env` dentro dos contêineres: cada serviço só recebe o que o Compose declara. |

O que cada serviço recebe:

| Serviço | Recebe | Como |
|---|---|---|
| `backend` | `JWT_SECRET` e `PORTARIA_OPERATOR_IDS` | `environment:`. O `JWT_SECRET` usa `${JWT_SECRET:?Defina JWT_SECRET ...}` e o `PORTARIA_OPERATOR_IDS` usa `${PORTARIA_OPERATOR_IDS:-}` (vazio se faltar). |
| `frontend` | `VITE_API_URL` | `build.args`, com padrão `/api/v1`. É usada **só na construção da imagem** (`npm run build` embute o valor no JavaScript). Mudar o valor exige reconstruir com `--build`. |

### 2.3 O que acontece se `JWT_SECRET` não for definido

| Situação | Resultado | Confirmado em |
|---|---|---|
| Com Docker, variável ausente ou vazia no `.env` | O Compose recusa subir e mostra "Defina JWT_SECRET com pelo menos 32 caracteres no arquivo .env". O contêiner nem é criado. | `docker-compose.yml` (`:?`). A recusa também para valor vazio é o comportamento documentado do Compose para `:?`; **não confirmado em execução**. |
| Sem Docker, variável ausente | O backend não inicia. `application.properties` usa `app.jwt.secret=${JWT_SECRET}` **sem valor padrão**, e o Spring falha ao resolver o placeholder. | `application.properties` e `JwtService` (`@Value("${app.jwt.secret}")`). Mensagem exata **não confirmada em execução**. |
| Segredo com menos de 32 caracteres | O backend tende a falhar ao iniciar: `JwtService` chama `Keys.hmacShaKeyFor(...)`, que na biblioteca jjwt recusa chaves com menos de 256 bits. | `JwtService`. O limite vem do comportamento da biblioteca, **não confirmado em execução**. |

A mensagem "pelo menos 32 caracteres" está no Compose e em `application.properties`. Nenhum código valida o tamanho antes do jjwt.

Outros pontos sobre as variáveis:

- **`PORTARIA_OPERATOR_IDS` com valor que não é número** (por exemplo `abc`): `PortariaOperadores` usa `Long.valueOf` no construtor, então o backend falha ao iniciar. Espaços e itens vazios entre as vírgulas são ignorados.
- **A lista é lida uma vez, na inicialização.** Mudar o valor exige reiniciar o backend. O usuário não precisa fazer login de novo: o papel é recalculado a cada requisição a partir do `uid` do token.
- **Sem Docker, o backend não lê o arquivo `.env`.** As variáveis precisam estar no ambiente do terminal (seção 5). O Vite também não lê o `.env` da raiz do projeto: por padrão ele procura na pasta `frontend/`.
- **`VITE_API_URL` sem Docker.** Em `api/http.ts`, `baseURL` é `import.meta.env.VITE_API_URL`, e não existe `frontend/.env` nem valor padrão no código. Sem a variável, o Axios chama `/auth/login` em vez de `/api/v1/auth/login`, e o proxy do Vite (só para `/api`) não encaminha. Por isso a seção 5 define `VITE_API_URL=/api/v1` antes de `npm run dev`. **Não confirmado em execução.**

---

## 3. Configuração das propriedades da aplicação

Pasta: `backend/src/main/resources/`.

### 3.1 `application.properties` (sempre carregado)

| Chave | Valor | Efeito |
|---|---|---|
| `spring.application.name` | `eventus` | Nome da aplicação. |
| `spring.datasource.url` | `jdbc:h2:file:./data/eventus;MODE=PostgreSQL;AUTO_SERVER=TRUE` | H2 **em arquivo**, relativo à pasta onde o processo roda. Modo de compatibilidade com PostgreSQL. `AUTO_SERVER=TRUE` permite abrir o mesmo arquivo por mais de um processo. |
| `spring.datasource.username` / `password` | `sa` / vazio | Credenciais do H2. Não há segredo de banco para configurar. |
| `spring.jpa.hibernate.ddl-auto` | `update` | O Hibernate cria e ajusta as tabelas na inicialização. Não há Flyway nem Liquibase. |
| `spring.jpa.show-sql` | `true` | Imprime o SQL no log, em qualquer ambiente. |
| `spring.jpa.database-platform` | `org.hibernate.dialect.H2Dialect` | Dialeto do Hibernate. |
| `app.jwt.secret` | `${JWT_SECRET}` | Sem valor padrão (seção 2.3). |
| `app.jwt.expiration-minutes` | `60` | Validade do token. Fixo, não vem de variável de ambiente. |
| `app.portaria.operator-ids` | `${PORTARIA_OPERATOR_IDS:}` | Vazio se a variável não existir. |
| `springdoc.api-docs.enabled` / `springdoc.swagger-ui.enabled` | `false` | Swagger e OpenAPI desligados por padrão. |
| `spring.servlet.multipart.max-file-size` / `max-request-size` | `2MB` | Limite do upload da imagem de capa. |

Onde o banco fica:

| Modo | Caminho do arquivo |
|---|---|
| Sem Docker, rodando em `backend/` | `backend/data/eventus` (a pasta `data/` está no `.gitignore`) |
| Docker | `/app/data/eventus` dentro do contêiner, no volume `h2_data` |

### 3.2 `application-dev.properties` (só com o perfil `dev`)

| Chave | Valor | Efeito |
|---|---|---|
| `springdoc.api-docs.enabled` | `true` | Liga o OpenAPI em `/v3/api-docs`. |
| `springdoc.swagger-ui.enabled` | `true` | Liga o Swagger em `/swagger-ui.html`. |

Como ativar: `SPRING_PROFILES_ACTIVE=dev` antes de iniciar o backend. O `SecurityConfig` já libera `/v3/api-docs/**` e `/swagger-ui/**`. O Compose não ativa o perfil (seção 8).

### 3.3 `src/test/resources/application-test.properties` (só nos testes)

H2 **em memória** (`jdbc:h2:mem:eventus`), `ddl-auto=create-drop`, `app.jwt.secret` fixo de teste e `app.portaria.operator-ids=1`. Os testes não dependem de `JWT_SECRET` nem tocam no arquivo de dados.

---

## 4. Como executar com Docker

Na raiz do projeto.

1. **Copiar o modelo de variáveis.**
   ```bash
   cp .env.example .env      # no Windows: copy .env.example .env
   ```
   Cria o `.env` local, que o Compose lê sozinho e que o Git ignora.

2. **Preencher o `.env`.**
   - `JWT_SECRET`: obrigatório, 32 caracteres ou mais.
   - `PORTARIA_OPERATOR_IDS`: opcional. Ids dos operadores da portaria. Como o id é gerado no cadastro, o primeiro usuário de um banco vazio tem o id `1` (ver 8).
   - `VITE_API_URL`: mantenha `/api/v1`, para o navegador chamar a API pela mesma origem (Nginx).

3. **Construir e subir.**
   ```bash
   docker compose up -d --build
   ```
   - `--build` reconstrói as imagens. O backend roda `./mvnw -B package`, que **executa os testes do backend** durante o build (ver 8). O frontend roda `npm ci` e `npm run build`.
   - `-d` deixa os contêineres em segundo plano.
   - O `frontend` só começa depois que o contêiner `backend` for criado (`depends_on`). Não há `healthcheck`, então isso não garante que a API já esteja pronta.

4. **Acessar.**

   | Serviço | Porta no host | Endereço |
   |---|---|---|
   | Frontend (Nginx) | 3000 | http://localhost:3000 |
   | Backend (API) | 8080 | http://localhost:8080/api/v1/test |

   O Nginx serve a SPA e encaminha `/api` para `http://backend:8080` na rede `eventus-network`.

5. **Acompanhar.**
   ```bash
   docker compose ps
   docker compose logs -f backend
   ```

6. **Aplicar mudanças.** Depois de alterar código, `docker compose build backend` ou `build frontend` e `docker compose up -d` (comandos em `docs/10-servicos.md`). Alterar `VITE_API_URL` exige reconstruir o frontend.

7. **Parar.**
   ```bash
   docker compose down
   ```
   Remove os contêineres e a rede. O volume `h2_data` **continua**, então os dados são mantidos.

8. **Zerar o banco.**
   ```bash
   docker compose down -v
   ```
   `-v` também apaga o volume `h2_data`, o que apaga o banco por completo. Use com cuidado: não há cópia de segurança.

---

## 5. Como executar sem Docker

São dois terminais, um para o backend e outro para o frontend. Sem Docker, o banco é o arquivo `backend/data/eventus`, e não o volume do Docker.

### 5.1 Backend

1. **Entrar na pasta.** `cd backend`. O caminho do banco (`./data/eventus`) é relativo a ela.
2. **Definir as variáveis no terminal.** O backend não lê o `.env`.

   | Terminal | Comandos |
   |---|---|
   | Bash (Linux, macOS, Git Bash) | `export JWT_SECRET="troque-por-um-segredo-com-32-ou-mais-caracteres"` e `export PORTARIA_OPERATOR_IDS=1` |
   | PowerShell | `$env:JWT_SECRET="troque-por-um-segredo-com-32-ou-mais-caracteres"` e `$env:PORTARIA_OPERATOR_IDS="1"` |
   | CMD | `set JWT_SECRET=troque-por-um-segredo-com-32-ou-mais-caracteres` e `set PORTARIA_OPERATOR_IDS=1` |

3. **Iniciar.**
   - Linux, macOS, Git Bash: `./mvnw spring-boot:run`
   - Windows (PowerShell ou CMD): `.\mvnw.cmd spring-boot:run`

   A primeira execução baixa o Maven e as dependências. A API sobe em `http://localhost:8080`. O Spring Boot usa a porta 8080, e nenhum arquivo do projeto a altera.
4. **Verificar.** `http://localhost:8080/api/v1/test` deve responder `{"status":"UP", ...}`.
5. **Opcional: Swagger.** Ative o perfil antes do passo 3 (`SPRING_PROFILES_ACTIVE=dev`, definido como as variáveis acima). A documentação fica em `http://localhost:8080/swagger-ui.html`.

### 5.2 Frontend

1. **Entrar na pasta.** `cd frontend`
2. **Instalar as dependências.** `npm ci`. Instala exatamente o que está no `package-lock.json`.
3. **Definir a URL da API.** `VITE_API_URL` precisa valer `/api/v1` (seção 2.3). Duas formas:
   - criar `frontend/.env` com a linha `VITE_API_URL=/api/v1` (o `.env` já está no `.gitignore`);
   - ou definir a variável no terminal antes do passo 4.
4. **Iniciar.** `npm run dev`. O Vite sobe em `http://localhost:5173` (porta padrão do Vite; o `vite.config.ts` não define outra, **não confirmado em execução**).
5. **Como as chamadas chegam à API.** O `vite.config.ts` tem `server.proxy` com `'/api': 'http://localhost:8080'`. O navegador chama `http://localhost:5173/api/v1/...` e o Vite encaminha para o backend, na mesma origem. Por isso o backend não tem CORS.

O backend precisa estar de pé antes de usar o frontend.

---

## 6. Testes

### 6.1 Comandos

| O quê | Comando | Pasta |
|---|---|---|
| Testes do backend (e o resto do ciclo Maven) | `./mvnw -B verify` (Windows: `.\mvnw.cmd -B verify`) | `backend/` |
| Só os testes do backend | `./mvnw test` | `backend/` |
| Lint do frontend | `npm run lint` (`eslint .`) | `frontend/` |
| Verificação de tipos e build do frontend | `npm run build` (`tsc -b && vite build`) | `frontend/` |

O CI roda `./mvnw -B verify` no backend e `npm ci`, `npm run lint` e `npm run build` no frontend. **Não executei nenhum desses comandos nesta etapa.**

O frontend **não tem testes automatizados**: o `package.json` não tem script `test`, não há biblioteca de teste nas dependências e não existem arquivos `*.test.*` ou `*.spec.*` em `frontend/`. A única verificação automática do frontend é o lint e o build (com checagem de tipos).

### 6.2 Contagem de testes do backend

**Não executado nesta etapa.** A contagem abaixo vem da leitura do código (anotações `@Test` em `backend/src/test`). Não há `@ParameterizedTest`, `@Nested`, `@RepeatedTest` nem `@Disabled`.

| Suíte | Tipo | `@Test` | O que cobre |
|---|---|---|---|
| `EventusApplicationTests` | Contexto | 1 | Sobe o contexto Spring com o perfil `test`. |
| `ApiFluxoTest` | Integração (`@SpringBootTest` + `MockMvc`) | 1 | Um fluxo único e longo: acesso sem token, Swagger desligado, cadastro e duplicidade de e-mail e CPF, login, `operador` verdadeiro para o primeiro usuário e falso para o segundo, dependentes, criação e edição de evento (incluindo `403` e `404`), upload de imagem, troca de senha e inscrição. |
| `RegressaoApiTest` | Integração (`@SpringBootTest` + `MockMvc`) | 7 | Health check; rotas protegidas; cadastro, login e perfil; eventos e upload de imagem; inscrição (período, capacidade, unicidade); portaria (busca e check-in único); dependentes. Limpa o banco e reinicia o id dos usuários antes de cada teste. |
| `AuthServiceTest` | Unitário (Mockito) | 6 | Idade mínima de 18 anos, hash da senha, bloqueio de login após 5 erros por 15 minutos, zerar o contador no sucesso. |
| `DependenteServiceTest` | Unitário (Mockito) | 5 | Criar e listar dependentes, e usuário do token inexistente. |
| `EventoServiceTest` | Unitário (Mockito) | 13 | Datas do evento, upload de imagem, atualização, `404`, e edição só pelo criador (inclusive evento sem criador). |
| `InscricaoServiceTest` | Unitário (Mockito) | 7 | Inscrição, duplicidade, capacidade (sem vagas e última vaga), início e fim do período, evento inexistente. |
| `PortariaServiceTest` | Unitário (Mockito) | 7 | Busca por código, nome e CPF com pontuação, busca vazia, check-in, check-in repetido e inscrição inexistente. |
| **Total** | | **47** | 2 de contexto e integração geral, 7 de integração por área, 38 unitários. |

`RelogioMutavel` não é teste: é um `Clock` ajustável que os testes usam para simular datas.

O `ApiFluxoTest` e o `RegressaoApiTest` dependem do `application-test.properties`, que define o usuário de **id 1** como operador da portaria. O `RegressaoApiTest` reinicia o id antes de cada teste para isso funcionar. Ver a Parte 6 para a análise dessa dependência.

---

## 7. Integração contínua (CI)

Arquivos em `.github/workflows/`.

### 7.1 `ci.yml` (workflow "CI")

- **Gatilhos:** `push` (qualquer branch) e `pull_request`.
- **Jobs**, ambos em `ubuntu-latest`, rodando em paralelo:

| Job | Pasta | Passos |
|---|---|---|
| `backend` | `backend` | `actions/checkout@v4` → `actions/setup-java@v4` (Temurin, **Java 21**, cache Maven) → `./mvnw -B verify` |
| `frontend` | `frontend` | `actions/checkout@v4` → `actions/setup-node@v4` (**Node 20**, cache npm com `frontend/package-lock.json`) → `npm ci` → `npm run lint` → `npm run build` |

O `ci.yml` não faz deploy, não publica imagem Docker e não roda testes do frontend (não existem).

### 7.2 `branch-name.yml` (workflow "Branch name")

- **Gatilhos:** `push` em qualquer branch **exceto** `main`, `dev` e `test`, e `pull_request`.
- **Job** `validate_branch_name`: lê o nome da branch (`github.head_ref` em PR, ou `github.ref_name` em push) e **falha com `exit 1`** se não bater com o padrão.
- **Nomes aceitos:**

| Tipo | Regra |
|---|---|
| Branches fixas | exatamente `main`, `dev` ou `test` |
| Com prefixo | `feature/`, `fix/`, `bugfix/`, `hotfix/`, `docs/`, `test/` ou `refactor/`, seguido de ao menos um caractere (`^(...)/.+$`) |

- Qualquer outro nome (por exemplo `minha-branch` ou `feature-login`) é recusado, com a mensagem "Use: feature/, fix/, bugfix/, hotfix/, docs/, test/ ou refactor/ + descrição".
- O comentário do próprio arquivo diz que ignorar `main`, `dev` e `test` no `push` é opcional. Em `pull_request` o nome também é validado, e essas três passam pela regra das branches fixas.
- Não há mais nenhuma regra (tamanho, caracteres permitidos ou padrão de commit).

---

## 8. Pontos de atenção operacional

| # | Ponto | O que acontece | Confirmado em |
|---|---|---|---|
| 1 | `JWT_SECRET` ausente | Com Docker, o Compose não sobe. Sem Docker, o backend não inicia. Ver 2.3. | `docker-compose.yml`, `application.properties` |
| 2 | `JWT_SECRET` curto | O backend pode falhar ao iniciar (limite do jjwt). Use 32 caracteres ou mais. | `JwtService`; limite **não confirmado em execução** |
| 3 | `PORTARIA_OPERATOR_IDS` inválido | Valor não numérico derruba a inicialização. Mudar a lista exige reiniciar o backend. | `PortariaOperadores` |
| 4 | Sem operador configurado | `/api/v1/portaria/**` responde `403` para todos, e o link Portaria não aparece. O id é gerado no cadastro: o operador precisa se cadastrar antes e depois ter o id colocado na lista. | `SecurityConfig`, `PortariaOperadores` |
| 5 | Porta ocupada | O Compose publica `8080` (backend) e `3000` (frontend); sem Docker, o backend usa `8080` e o Vite `5173`. Se a porta estiver em uso, o serviço não sobe. As portas são fixas no `docker-compose.yml`. | `docker-compose.yml` |
| 6 | Volume `h2_data` antigo | O banco persiste entre `down` e `up`. Dados de teste e esquemas antigos continuam. O `ddl-auto=update` só ajusta as tabelas, e não é uma migração: mudanças que não são simples adições não são aplicadas. Para começar do zero, `docker compose down -v`. | `application.properties`, `docker-compose.yml` |
| 7 | Dados sem Docker e com Docker são separados | `backend/data/eventus` (local) e o volume `h2_data` (Docker) são bancos diferentes. | `application.properties`, `docker-compose.yml` |
| 8 | Perfil `dev` não ativo no Docker | O Compose não define `SPRING_PROFILES_ACTIVE`, então o Swagger e o OpenAPI ficam desligados nos contêineres e `/swagger-ui.html` não funciona. Para ativar, é preciso adicionar a variável ao serviço `backend` no Compose. O arquivo não faz isso hoje. | `docker-compose.yml`, `application.properties` |
| 9 | Build do backend roda os testes | O Dockerfile usa `./mvnw -B package`, e a fase `package` do Maven executa os testes. Teste que falha impede a construção da imagem, e o build fica mais lento. Não há `skipTests` no `pom.xml` nem no Dockerfile. | `backend/Dockerfile`, `pom.xml` |
| 10 | `VITE_API_URL` embutida na imagem | O valor é fixado no `npm run build`. Mudar o `.env` sem `--build` não muda o frontend. | `frontend/Dockerfile`, `docker-compose.yml` |
| 11 | `VITE_API_URL` ausente sem Docker | As chamadas vão para a URL sem `/api/v1` e o proxy do Vite não as encaminha. Ver 2.3. | `api/http.ts`, `vite.config.ts`; **não confirmado em execução** |
| 12 | Bloqueio de login em memória | As tentativas de login ficam em um `HashMap`. Reiniciar o backend desbloqueia todo mundo. | `TentativasLoginService` |
| 13 | SQL no log | `spring.jpa.show-sql=true` está sempre ligado, inclusive no Docker. Os logs crescem. | `application.properties` |
| 14 | Sem `healthcheck` e sem política de dependência real | O `frontend` espera só a criação do contêiner `backend`. O Nginx pode responder antes de a API terminar de iniciar, e as chamadas falham até lá. | `docker-compose.yml` |
| 15 | Backend roda como usuário `spring` | A pasta `/app/data` é do usuário `spring`. Um volume criado por outra imagem ou com outro dono pode causar erro de permissão ao gravar o banco. **Não confirmado em execução.** | `backend/Dockerfile` |

---

## 9. Informações não confirmadas

| Item | Onde verificar |
|---|---|
| Recusa do Compose também para `JWT_SECRET` vazio | Rodar `docker compose config` com `JWT_SECRET=` no `.env` |
| Mensagem de erro do Spring sem `JWT_SECRET` | Iniciar o backend sem a variável e ler o log |
| Falha do jjwt com segredo menor que 32 caracteres | Iniciar o backend com um segredo curto |
| Chamadas sem `/api/v1` quando `VITE_API_URL` não existe | Rodar `npm run dev` sem a variável e olhar a aba Rede do navegador |
| Porta padrão `5173` do Vite | Saída do `npm run dev` |
| Contagem de 47 testes | Relatório do `./mvnw verify` (`backend/target/surefire-reports`) |
| Permissão do volume `h2_data` | `docker compose exec backend ls -la /app/data` |
