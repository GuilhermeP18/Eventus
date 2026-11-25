# Parte 6: Análise Técnica e Débitos

> Estado conferido na branch `docs/documentacao-tecnica`. Este documento reúne os pontos de atenção encontrados na leitura do código e remete às Partes 2 a 5 para os detalhes. Nada foi executado: nem testes, nem build, nem Docker. O que depende de execução está marcado como **não confirmado em execução**.

## 1. Visão geral da análise

### 1.1 O que foi avaliado

| Área | Arquivos lidos |
|---|---|
| Regras de negócio e segurança | `backend/src/main/java/com/eventus/eventus/`: `service/`, `security/`, `config/SecurityConfig.java`, `exception/` |
| Dados | `model/`, `repository/`, `dto/`, `application.properties` |
| Testes | `backend/src/test/` (`ApiFluxoTest`, `RegressaoApiTest`, `application-test.properties`) |
| Infraestrutura | `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf`, `.github/workflows/` |
| Frontend | `frontend/src/auth/`, `api/`, `pages/` |

Uma busca por `TODO`, `FIXME`, `XXX` e `HACK` em `backend/src` e `frontend/src` não encontrou nenhuma marcação. Os pontos abaixo vêm da leitura do código, e cada um traz arquivo e linha.

### 1.2 Como ler as referências

| Referência | Significado |
|---|---|
| `Arquivo.java:N` | Linha `N` do arquivo, na versão do repositório conferida. O número pode mudar se o arquivo for editado. |
| "Parte 3", "Parte 4", "Parte 5" | `docs/02-dominio-e-dados.md`, `docs/03-api-e-interfaces.md` e `docs/04-setup-e-operacao.md` |
| **não confirmado em execução** | Conclusão tirada do código ou do comportamento conhecido de uma biblioteca, sem rodar o sistema |

### 1.3 Resumo

| Categoria | Itens | Seção |
|---|---|---|
| Dívida técnica | 8 principais e 5 adicionais | 2 |
| Segurança | 18 controles implementados e 11 lacunas | 3 |
| Gargalos e escala | 6 | 4 |
| Funcionalidades previstas e não implementadas | 8 | 5 |
| Próximos passos | 9 | 6 |

---

## 2. Dívida técnica

### 2.1 Itens principais

| # | Item | Onde está | Impacto | Sugestão de correção |
|---|---|---|---|---|
| D1 | **Bloqueio de login só em memória** | `TentativasLoginService.java:28` (`new HashMap<>()`); o comentário da classe (linhas 13–16) já diz que o estado é zerado ao reiniciar | Reiniciar o backend desbloqueia todos os e-mails. Com mais de uma instância, cada uma conta as falhas separadamente, então o limite de 5 vira 5 por instância. O mapa também cria uma entrada para qualquer e-mail digitado errado (`registrarFalha`, linha 50) e só remove ao acertar a senha ou depois do bloqueio expirado, então cresce sem limite. | Guardar tentativas no banco ou em um cache compartilhado e remover entradas antigas. Considerar também limitar por IP. |
| D2 | **Token JWT continua válido depois da troca de senha** | `AuthService.alterarSenha` (linhas 80–93) só regrava o hash. `JwtService.gerar` (linhas 35–45) coloca `sub`, `uid`, `iat` e `exp`, sem versão da senha. `JwtService.extrairIdentidade` (linha 51) e `JwtAuthenticationFilter.java:40` conferem só assinatura e validade e não consultam o banco. | Um token roubado continua funcionando até expirar (`app.jwt.expiration-minutes=60`, `application.properties:12`), mesmo depois de a pessoa trocar a senha. O `iat` existe no token, mas nada o compara com a data da troca. | Guardar a data da última troca de senha (ou um número de versão) no usuário e recusar tokens emitidos antes dela. Alternativa: lista de tokens revogados. |
| D3 | **Limite de vagas sem controle de concorrência** | `InscricaoService.inscrever`: `@Transactional` na linha 40, contagem na linha 55 (`countByEventoId`) e `save` na linha 64. Não há `@Lock` nem `@Version` no código (busca em `backend/src/main`). O banco só tem a restrição única `(usuario_id, evento_id)` (`Inscricao.java:20–21`), nenhuma sobre capacidade. | Duas inscrições simultâneas na última vaga podem passar as duas, deixando o evento acima da capacidade. É a RN017 (parcial na Parte 3, seção 6.1). **A corrida em si não foi reproduzida**: não confirmado em execução. | Bloquear a linha do evento durante a inscrição (por exemplo `@Lock(PESSIMISTIC_WRITE)` na busca do evento) ou fazer a contagem e a gravação de forma atômica. Criar um teste com requisições concorrentes. |
| D4 | **`ApiFluxoTest` depende do usuário de id 1** | `ApiFluxoTest.java:80` espera `operador = true` para o primeiro usuário cadastrado (`ana@email.com`). `application-test.properties:8` define `app.portaria.operator-ids=1`. O arquivo não limpa o banco nem reinicia o id. `RegressaoApiTest.java:64–72` limpa as tabelas e faz `ALTER TABLE usuarios ALTER COLUMN id RESTART WITH 1` antes de cada teste (o comentário nas linhas 70–71 explica o motivo). | Se o banco em memória já tiver usuários quando o `ApiFluxoTest` rodar, a `ana` recebe outro id, deixa de ser operadora e o teste falha. Não há `@Order` nem `@TestMethodOrder` no projeto. As duas classes têm as mesmas anotações (`@SpringBootTest`, `@AutoConfigureMockMvc`, `@ActiveProfiles("test")`), o que em princípio leva o Spring a reutilizar o mesmo contexto: **não confirmado em execução**. O `fluxoCompleto` também é um único teste muito longo, o que dificulta achar a causa de uma falha. | Fazer o `ApiFluxoTest` limpar o banco e reiniciar o id (como o `RegressaoApiTest`), ou cadastrar o operador e usar o id devolvido. Dividir o fluxo em testes menores. |
| D5 | **RN007: idade mínima diverge da regra** | `AuthService.java:26` (`IDADE_MINIMA = 18`) e `validarIdade` (linhas 109–113) contra `docs/07-regras-de-negocio.md` (RN007: menores de 13 anos). | Regra e código dizem coisas diferentes. Detalhes na Parte 3, seção 4.4 e linha RN007 da seção 6.1. | Decisão do Product Owner: manter 18 anos e atualizar a regra, ou mudar o código. |
| D6 | **Perfil `dev` não ativo no Docker** | `docker-compose.yml` não define `SPRING_PROFILES_ACTIVE`; `application.properties:16–17` desliga o Swagger. | O Swagger não aparece nos contêineres. Detalhes na Parte 5, seção 8, item 8. | Adicionar a variável ao serviço `backend` quando o Swagger for desejado. |
| D7 | **Frontend sem testes automatizados** | `frontend/package.json` não tem script `test` nem biblioteca de teste. Detalhes na Parte 5, seção 6.1. | A única verificação automática é `npm run lint` e `npm run build` (com checagem de tipos). Regras do frontend, como a máscara de campos e o `podeEditarEvento`, não têm teste. | Adicionar uma biblioteca de testes e cobrir primeiro o `AuthProvider`, os utilitários (`utils/`) e as telas de login e inscrição. |
| D8 | **Code smells listados na Parte 4** | Parte 4, seção 11 (`JwtService.extrairEmail` sem uso, métodos de repositório sem uso, `AuthController.emailLogado` redundante, mensagem fixa no `429`). | Código morto e duplicado. | Ver a sugestão de cada item na própria Parte 4. |

> A Parte 4, seção 11, cita uma linha duplicada de `setError(null)` em `Home.tsx`. Ao conferir para esta Parte, **não encontrei a duplicação** (`Home.tsx:20` tem uma só). Não repito o item aqui. Ver a seção 7 sobre a correção da Parte 4.

### 2.2 Itens adicionais

| # | Item | Onde está | Impacto | Sugestão de correção |
|---|---|---|---|---|
| D9 | **Sem migrações de banco** | `application.properties:6` (`ddl-auto=update`); não há Flyway nem Liquibase (Parte 3, seção 1) | O esquema muda conforme as entidades. Alterações que não são simples adições não são aplicadas a um banco existente. Não há histórico de versões do esquema. | Adotar Flyway ou Liquibase junto com a troca para PostgreSQL. |
| D10 | **Mensagem de conflito enganosa** | `GlobalExceptionHandler.conflito` (`DataIntegrityViolationException` sempre vira "E-mail ou CPF já cadastrado") | Uma inscrição duplicada que cai na restrição única do banco recebe essa mensagem (Parte 3, seção 4.3). | Distinguir a restrição violada e devolver a mensagem certa. |
| D11 | **Check-in sem data/hora e sem operador** | `Inscricao.java:46–48` (só `presente`); `PortariaService.registrarEntrada` (linhas 34–43) | Não há como saber quando nem por quem a entrada foi registrada. O briefing pede os dois (regra 6, Parte 3, seção 6.2). | Gravar data/hora e id do operador no check-in. |
| D12 | **Verificação do CPF só por formato** | `CadastroRequest.java` (`@Pattern`) | CPFs com formato válido e dígitos verificadores inválidos são aceitos (Parte 3, seção 3.1). | Validar os dígitos verificadores no backend. |
| D13 | **SQL no log em qualquer ambiente** | `application.properties:7` (`spring.jpa.show-sql=true`) | Logs grandes e consultas visíveis nos contêineres (Parte 5, seção 8, item 13). | Ligar só no perfil `dev`. |

---

## 3. Segurança

### 3.1 O que já está implementado

| Controle | Onde | Observação |
|---|---|---|
| Senha com BCrypt | `SecurityConfig.java:59` (`new BCryptPasswordEncoder()`); `AuthService.java:60` (`encoder.encode`) | Custo padrão do BCrypt. A senha nunca sai nas respostas (`UsuarioResponse` não tem o campo). |
| Limite de senha de 72 caracteres | `CadastroRequest`, `AlterarSenhaRequest` (`@Size(min = 8, max = 72)`) | 72 é o limite de bytes do BCrypt. |
| JWT assinado (HMAC) | `JwtService` (`Keys.hmacShaKeyFor`) | Segredo vindo de `JWT_SECRET`, sem valor padrão (Parte 5, seção 2.3). |
| Validade do token | `application.properties:12` | 60 minutos. |
| Rotas protegidas por padrão | `SecurityConfig` (`anyRequest().authenticated()`) | Só `test`, `cadastro`, `login` e as leituras de eventos são públicas (Parte 4, seção 1.1). |
| Portaria restrita a operadores | `SecurityConfig` (`hasRole("OPERADOR")`); `PortariaOperadores` | O papel vem de `PORTARIA_OPERATOR_IDS`, não do banco. |
| Edição só pelo criador | `EventoService.validarCriador` | `403` para os demais. |
| `401` e `403` em JSON | `SecurityConfig.java:68` (`escrever`) | Mesmo formato do `GlobalExceptionHandler`. |
| Mensagem de login sem dizer o campo errado | `AuthService.login` | "E-mail ou senha incorretos". |
| Bloqueio por tentativas | `TentativasLoginService` | 5 falhas, 15 minutos, `429`. Limitado pelo item D1. |
| Limite de 2 MB no upload | `application.properties:19–21`; `GlobalExceptionHandler.arquivoGrande` (`413`) | |
| Tipos de imagem permitidos | `EventoService` (`image/jpeg`, `image/png`, `image/webp`) | Conferido só pelo `Content-Type` declarado, não pelo conteúdo. |
| Validação de entrada | DTOs com `jakarta.validation` e `@Valid` nos controllers | Erros em `campos`. |
| CPF mascarado na portaria | `PortariaInscricaoResponse.mascararCpf` | Só os dois últimos dígitos. |
| Swagger desligado por padrão | `application.properties:16–17` | Só liga no perfil `dev`. |
| Sessão sem estado e CSRF desligado | `SecurityConfig.java:36` | CSRF desligado porque o token vai no cabeçalho `Authorization`. |
| Segredos fora do repositório | `.gitignore` (`.env`); `.env.example` sem valores | |
| Backend como usuário sem privilégio no Docker | `backend/Dockerfile` (`USER spring`) | |

### 3.2 O que falta ou merece atenção

| Lacuna | Situação | Referência |
|---|---|---|
| **Recuperação de senha** | Não existe. A troca exige a senha atual. | Parte 4, seção 11 |
| **Revogação de token e logout no servidor** | Não existe. O logout só apaga o token do navegador (`AuthProvider.logout`). | D2 |
| **Renovação de token (refresh)** | Não existe. Depois de 60 minutos a pessoa precisa entrar de novo. | Parte 4, seção 10.1 |
| **Token no `localStorage`** | `AuthProvider.tsx` grava `eventus.token` no `localStorage`, que qualquer script da página consegue ler (risco de XSS). Alternativa comum: cookie `HttpOnly`. | `frontend/src/auth/AuthProvider.tsx` |
| **Cabeçalhos de segurança no Nginx** | Confirmado: `frontend/nginx.conf` não tem nenhum `add_header` (sem CSP, `X-Frame-Options`, `X-Content-Type-Options`, HSTS). O Spring Security manda alguns cabeçalhos padrão nas respostas da API, mas as páginas servidas pelo Nginx não. | `frontend/nginx.conf` |
| **HTTPS** | O Nginx só escuta na porta 80 (`nginx.conf:2`). Não há TLS na configuração do projeto. Se houver terminação TLS fora do projeto, **não confirmado**. | `frontend/nginx.conf` |
| **Limite geral de requisições** | Não encontrado no código. Só o login tem limite (D1). `cadastro` e a busca da portaria não têm. | — |
| **Verificação de e-mail** | Não existe (RN004). Qualquer e-mail pode ser cadastrado. | Parte 3, seção 6.1 |
| **Conteúdo da imagem não verificado** | Só o `Content-Type` informado pelo cliente é conferido. Um arquivo que não é imagem pode ser gravado com tipo de imagem. | `EventoService.salvarImagem` |
| **Dependências sem análise de vulnerabilidades** | Não foi feita. **Não confirmado**: verificar com `./mvnw` (plugin de análise de dependências) e `npm audit`, que não foram rodados. | `pom.xml`, `package-lock.json` |
| **Banco H2 com usuário `sa` e senha vazia** | É o valor do projeto (`application.properties:3–4`). O console web do H2 não está habilitado nas propriedades, e o banco fica dentro do contêiner, sem porta publicada. Com `AUTO_SERVER=TRUE` o H2 abre um servidor TCP no processo: **se ele fica acessível fora do contêiner, não confirmado**. | `application.properties`, `docker-compose.yml` |

Outros pontos, de menor risco:

- A porta `8080` do backend é publicada no host (`docker-compose.yml`), então a API pode ser chamada sem passar pelo Nginx.
- A busca da portaria não escapa `%` e `_` no `LIKE` (Parte 4, seção 6.1).
- Qualquer usuário autenticado pode criar eventos (não há papel de organizador) (Parte 3, seção 4.6).

---

## 4. Gargalos e limitações de escala

| # | Ponto | Evidência no código | Efeito | Observação |
|---|---|---|---|---|
| G1 | **H2 em arquivo, dentro do processo** | `application.properties:2` (`jdbc:h2:file:./data/eventus`). O README e a ADR 0001 (`docs/06-banco-de-dados.md`) preveem PostgreSQL em produção, mas o `pom.xml` só tem o driver do H2. | Uma instância só do backend e o banco no mesmo contêiner (volume `h2_data`). Não há cópia de segurança nem réplica. Junto com D1, impede escalar para várias instâncias. | A troca de banco ainda não foi feita. |
| G2 | **Sem paginação** | Nenhum `Pageable`, `Page` ou `Slice` em `backend/src/main`. `EventoService.listar` (linhas 51–53) devolve todos os eventos; `InscricaoService.minhas` (linhas 67–72) e `DependenteService.listar` também devolvem tudo. | A resposta cresce com o número de registros. Os eventos já passados continuam na lista (Parte 4, seção 4.1). | O frontend também não pagina (`ListaEventos`). |
| G3 | **Busca da portaria sem limite e sem filtro por evento** | `InscricaoRepository.java:25–33` (`lower(u.nome) like lower(concat('%', :termo, '%'))`); `PortariaService.buscar` | O `LIKE` com `%` no início não usa índice comum, então o banco percorre a tabela. Devolve inscrições de todos os eventos. | Se o banco tem índice no nome: não há `@Index` nas entidades. Impacto real **não confirmado em execução**. |
| G4 | **Imagem como BLOB na tabela `eventos`** | `Evento.java:51–55` (`@Lob`, `byte[] imagem`); `EventoService.salvarImagem` lê o arquivo inteiro (`arquivo.getBytes()`, linha 65) | O banco cresce até 2 MB por evento, e o arquivo `data/eventus` fica maior e mais pesado de copiar. | Simplifica a implantação (Parte 2, seção 4.2). |
| G5 | **A listagem de eventos pode carregar todas as imagens** | `EventoResponse.java:12` chama `e.getImagem() == null` para cada evento da lista. O campo é `@Lob` e não há `@Basic(fetch = LAZY)` nem instrumentação de bytecode no `pom.xml`. | Pelo comportamento padrão do Hibernate, o campo `byte[]` vem junto com a linha do evento, então `GET /eventos` lê os BLOBs de todos os eventos só para saber se existe imagem. **Não confirmado em execução**: conferir o SQL no log (`show-sql=true`) ao chamar `GET /api/v1/eventos` com eventos que têm imagem. | Sugestão: guardar uma coluna ou um campo separado com a indicação de imagem, ou mover a imagem para outra tabela. |
| G6 | **Imagem sem cache condicional** | `EventoController` (`CacheControl.noCache()`, linha 70) e nenhuma configuração de `ETag` encontrada | `noCache` obriga a revalidar, e sem `ETag` o navegador baixa a imagem inteira a cada acesso. | **Não confirmado em execução** se o Spring gera `ETag` por outro caminho. |

Pontos relacionados, **não confirmados em execução**:

- **Limite de upload no Nginx.** `frontend/nginx.conf` não define `client_max_body_size`. O valor padrão do Nginx é 1 MB, menor que os 2 MB da API. Imagens entre 1 e 2 MB podem ser recusadas pelo Nginx com `413` antes de chegar ao backend. O `api/imagem.ts` já prevê esse caso em um comentário.
- **Consultas extras em `minhas`.** `Inscricao.evento` é `LAZY` e `InscricaoResponse.de` lê o evento de cada inscrição, o que pode gerar uma consulta por inscrição (N+1). Conferir o SQL no log.

---

## 5. Funcionalidades previstas e não implementadas

Estes itens estão descritos na Parte 4 (seção 11, linha "Endpoints ausentes") e nas Partes 3 (seções 5 e 6).

| Funcionalidade | Situação no código | Referência |
|---|---|---|
| Cancelar inscrição (e liberar a vaga) | Não existe endpoint nem status de inscrição. Regras 3 e 4 do briefing e RN023 e RN028 dependem disso. | Parte 3, seção 6; Parte 4, seção 2 |
| Excluir evento | Não existe. Também não há como cancelar um evento. | Parte 4, seção 2 |
| Editar e excluir dependente | Só há criar e listar. Dependentes não se ligam a eventos nem a inscrições. | Parte 3, seção 5; Parte 4, seção 7 |
| Logout no servidor | Não existe (ver D2 e seção 3.2). | Parte 4, seção 11 |
| Recuperação de senha | Não existe (RN006). | Parte 4, seção 11; Parte 3, seção 6.1 |
| Indicadores (dashboard) | Não existe endpoint nem tela. Regra 8 do briefing. | Parte 3, seção 6.2 |
| Registro de data/hora e operador no check-in | Só o booleano `presente` (D11). | Parte 3, seção 5 |
| Evento encerrado bloqueando alterações | O criador edita capacidade e datas a qualquer momento, sem registro. Regra 7 do briefing. | Parte 3, seção 6.2 |

As demais regras RN001–RN028 sem implementação estão na Parte 3, seção 6.1. A lista foi escrita para venda de ingressos, e boa parte está fora do escopo do briefing (`docs/07-regras-de-negocio.md`).

---

## 6. Próximos passos sugeridos

Em ordem de prioridade sugerida, sem prazos. A ordem considera o risco para os dados e a segurança, depois a confiabilidade dos testes e depois as funcionalidades.

| Ordem | Passo | Motivo | Itens |
|---|---|---|---|
| 1 | Garantir a capacidade do evento sob concorrência, com teste concorrente | Evita inscrições acima da capacidade, regra obrigatória do briefing | D3 |
| 2 | Invalidar tokens depois da troca de senha | Fecha a janela de uso de um token roubado | D2 |
| 3 | Tornar o `ApiFluxoTest` independente do id 1 e dividir o fluxo | Evita falhas de teste por ordem ou estado do banco | D4 |
| 4 | Tirar o bloqueio de login da memória | Passa a valer depois de reiniciar e com mais de uma instância | D1 |
| 5 | Paginar as listas, tirar a imagem da consulta da listagem e alinhar o `client_max_body_size` do Nginx a 2 MB | Evita crescimento de resposta e consumo de memória e rejeição indevida de imagens | G2, G5, seção 4 |
| 6 | Decidir com o Product Owner a idade mínima (RN007) e implementar o status da inscrição, o cancelamento e o registro de data/hora e operador no check-in | Fecha as regras 3, 4 e 6 do briefing | D5, D11, seção 5 |
| 7 | Migrar para PostgreSQL com migrações versionadas | Cumpre a ADR 0001 e permite várias instâncias | G1, D9 |
| 8 | Adicionar testes automatizados ao frontend | Hoje só há lint e build | D7 |
| 9 | Endurecer a entrega: cabeçalhos de segurança e HTTPS no Nginx, análise de dependências, SQL no log só em `dev`, mensagem de conflito correta | Melhorias de segurança e operação de menor impacto | Seção 3.2, D10, D13 |

---

## 7. Correções necessárias em outras Partes

Ao conferir os dados para esta Parte, encontrei uma afirmação das Partes anteriores que não se confirma:

| Arquivo | Trecho | Problema |
|---|---|---|
| `docs/03-api-e-interfaces.md` (seção 11) | Linha "`setError(null)` repetido", `frontend/src/pages/Home.tsx`, função `retry` | A função `retry` de `Home.tsx` (linhas 18–22) tem **uma** chamada a `setError(null)`. A duplicação não existe. Para corrigir, remover essa linha da tabela. Não alterei a Parte 4 por estar fora do pedido. |
