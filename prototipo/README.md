# Frontend de trabalho (origem Lovable)

**Origem:** projeto Lovable "EventFlow Pro", ID `e8c1c811-dbc0-5395-80b8-f053d6ce967f`, commit de referência `e55c4c3141fbe96df770bbc1e53d3e3c93c58921`.

Este é o frontend usado no desenvolvimento dos fluxos de autenticação. O cadastro e o login se comunicam com a API Spring Boot; os dados de eventos ainda usam a store local do protótipo.

## Como executar

Pré-requisito: Node.js 20 ou superior (referência: `frontend/Dockerfile`) e npm.

Inicie a API em um terminal:

```bash
cd backend
./mvnw spring-boot:run
```

Inicie o frontend em outro terminal:

```bash
cd prototipo
npm ci
npm run dev
```

O Vite encaminha `/api` para `http://localhost:8080`. Acesse http://localhost:5173.

O banco H2 do backend persiste os usuários. A store dos eventos, ingressos e compras do protótipo continua no navegador. O `docker compose` ainda usa o app separado de `frontend/`; para testar estas telas, rode o diretório `prototipo` com Vite.

## Telas (`src/routes/`)

- `__root.tsx` — layout raiz (Navbar, Toaster, 404 e página de erro)
- `index.tsx` — home com hero e vitrine de eventos
- `eventos.$id.ingresso.tsx` — escolha de lotes ou poltronas e checkout
- `eventos.index.tsx` — redireciona para a home
- `meus-ingressos.tsx` — ingressos, meus eventos e portaria (abas)
- `painel.tsx` — painel pessoal (perfil e segurança), protegido por login
- `admin.novo-evento.tsx` — criação de evento, protegido por login
- `login.tsx`, `cadastro.tsx`, `verificar-email.tsx` — autenticação conectada à API; verificação de e-mail adiada
- `admin.eventos.$id.tsx` — gestão do evento (vendas, extrato, participantes)
- `admin.index.tsx` — redireciona para a aba "Meus eventos"
- `admin.checkin.tsx` — redireciona para a aba "Portaria"
- `README.md` — convenções de rotas do TanStack Start

## Componentes (`src/components/`)

- `Navbar.tsx`
- `EventsHub.tsx`
- `MyEventsPanel.tsx`
- `CheckinPanel.tsx`

## Componentes de UI usados (`src/components/ui/`)

`badge`, `button`, `dialog`, `input`, `label`, `progress`, `select`, `separator`, `sonner`, `switch`, `table`, `tabs`, `tooltip`

## Outros

- `src/lib/store.ts` — estado (zustand) com dados de exemplo
- `src/lib/auth.ts` — cliente da API de cadastro, login, sessão e logout
- `src/lib/utils.ts`
- `src/hooks/use-mobile.tsx`
- `src/styles.css` — tema e tokens

## Autenticação integrada

| Método | Endpoint | Comportamento |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Valida dados, CPF/e-mail únicos, senha e responsável já cadastrado para menores de 18 anos |
| `POST` | `/api/v1/auth/login` | Inicia sessão HTTP; falhas usam mensagem genérica e 5 tentativas bloqueiam o e-mail por 15 minutos |
| `GET` | `/api/v1/auth/me` | Retorna o usuário da sessão e informa se tem 18 anos para organizar eventos |
| `POST` | `/api/v1/auth/logout` | Invalida a sessão |

As senhas são armazenadas com BCrypt no backend. A sessão usa cookie HttpOnly. A conta não possui papel fixo: adultos podem participar e organizar eventos; menores precisam indicar o e-mail de um responsável adulto que já tenha conta e não podem criar eventos. A API calcula a idade a partir da data de nascimento.

O envio de verificação por e-mail (RN004) foi adiado conforme decisão do escopo atual; por isso, contas novas ficam ativas após o cadastro. Recuperação de senha (RN006) também permanece fora desta etapa. As rotas `/painel`, `/meus-ingressos` e de gestão/criação de eventos exigem sessão; a criação/gestão de eventos exige usuário maior de idade.
