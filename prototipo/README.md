# Protótipo de referência do frontend (Lovable)

**Origem:** projeto Lovable "EventFlow Pro", ID `e8c1c811-dbc0-5395-80b8-f053d6ce967f`, commit de referência `e55c4c3141fbe96df770bbc1e53d3e3c93c58921`.

> Referência visual. Não é executado no CI nem no Docker. A implementação de produção fica em `frontend/`.

## Como executar

Pré-requisito: Node.js 20 ou superior (referência: `frontend/Dockerfile`) e npm.

```bash
cd prototipo
npm install
npm run dev
```

O `npm install` só é necessário na primeira vez. Depois, acesse http://localhost:5173.

O protótipo não usa Docker, banco nem backend. O cadastro e o login são simulados no navegador.

O protótipo não roda junto com o `docker compose`, que usa a porta 8080 para a API.

## Telas (`src/routes/`)

- `__root.tsx` — layout raiz (Navbar, Toaster, 404 e página de erro)
- `index.tsx` — home com hero e vitrine de eventos
- `eventos.$id.ingresso.tsx` — escolha de lotes ou poltronas e checkout
- `eventos.index.tsx` — redireciona para a home
- `meus-ingressos.tsx` — ingressos, meus eventos e portaria (abas)
- `painel.tsx` — painel pessoal (perfil e segurança), protegido por login
- `admin.novo-evento.tsx` — criação de evento, protegido por login
- `login.tsx`, `cadastro.tsx`, `verificar-email.tsx` — autenticação simulada
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
- `src/lib/auth.ts` — cadastro, login e logout simulados em `localStorage`
- `src/lib/utils.ts`
- `src/hooks/use-mobile.tsx`
- `src/styles.css` — tema e tokens

## Autenticação simulada (RN001-RN007)

Tudo roda no navegador, sem backend e sem segurança real. Os dados ficam em `localStorage` (`eventus.auth.*`). A senha é guardada como SHA-256 com salt (`crypto.subtle`), nunca em texto puro. O código de verificação de e-mail é gerado no cliente e exibido na tela, sem envio real.

| RN | Onde aparece |
| --- | --- |
| RN001 | Após login ou verificação, vai para o destino de `?redirect=`; sem destino, cliente vai para `/meus-ingressos` e organizador e funcionário vão para `/painel` |
| RN002 | `login.tsx` mostra "E-mail ou senha incorretos" sem indicar o campo errado |
| RN003 | 5 erros seguidos no mesmo e-mail bloqueiam o login por 15 minutos, com contagem regressiva |
| RN004 | Conta sem e-mail verificado não entra; `login.tsx` aponta para `verificar-email.tsx` |
| RN005 | `cadastro.tsx` recusa e-mail ou CPF já cadastrados, com aviso enquanto digita |
| RN006 | Não coberta: a recuperação de senha não faz parte desta etapa |
| RN007 | Data de nascimento obrigatória; menores de 13 anos são bloqueados, com a idade exibida |

### Rotas protegidas

`/painel` e `/admin/novo-evento` usam `beforeLoad` e redirecionam para `/login?redirect=<rota>` sem usuário logado. As demais rotas continuam abertas.
