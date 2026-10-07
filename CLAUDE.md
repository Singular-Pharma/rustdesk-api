# CLAUDE.md

Fork Singular do [lejianwen/rustdesk-api](https://github.com/lejianwen/rustdesk-api) (upstream sem manutenção desde 09/2025), organizado como monorepo pnpm + Turbo:

- `apps/api`: API Go original (Gin + Gorm). Serve o cliente RustDesk e o contrato `/api/admin` usado pelo painel. Deploy pelo Dokploy na sp1 com `apps/api/dokploy/docker-compose.yml`.
- `apps/web`: painel administrativo novo em React (Vercel). Substitui o painel Vue do `rustdesk-api-web`, que continua embutido na imagem da API até o painel novo ser adotado.
- `packages/ui`: componentes shadcn sobre Base UI, com o tema da Singular Pharma (Raleway, Lucide).

UI em pt-BR, identificadores em inglês. Base dos PRs: `singular`. Merge commit, nunca squash.

## Produção

O `pnpm dev` faz proxy de `/api/admin` para `API_PROXY_TARGET`, que por padrão é a API de produção (`https://remoto-api.singularpharma.com.br`). **Toda escrita feita no dev server atinge produção**: dispositivos, usuários, catálogos e comandos enviados ao servidor de ID e de relay. Para testar escrita, subir a API local e apontar `API_PROXY_TARGET` em `apps/web/.env.local` para ela. Nunca rodar fluxo de escrita contra produção para verificar tela.

Na Vercel, `apps/web/vercel.json` reescreve `/api/admin/*` para a mesma API e devolve `index.html` nas demais rotas. O projeto da Vercel usa root `apps/web`.

## Comandos

Node e pnpm seguem `.nvmrc` e `packageManager`. Não usar npm nem gerar package-lock.

```bash
pnpm install --frozen-lockfile
pnpm dev            # painel em http://localhost:4300
pnpm typecheck
pnpm lint
pnpm build
pnpm format:check
```

Não há suíte de testes no painel. Não criar spec (unitário ou e2e) sem pedido explícito, nem para tirar screenshot: validar com typecheck, lint, build e inspeção no browser em desktop e celular.

A API Go não tem toolchain na máquina de desenvolvimento atual. Mudança em `apps/api` precisa compilar no build do Dokploy (`go mod tidy` + `swag init` + `go build`); manter a alteração mínima e conferir com `gofmt` quando houver Go disponível.

## Contrato `/api/admin`

- Envelope `{code, message, data}`; `code` 0 é sucesso. Erro de negócio volta com HTTP 200 e `code` diferente de 0. A mensagem vem em inglês (`Accept-Language: en`) e é traduzida em `shared/api/api-error.ts`; nunca mostrar `message` cru.
- Header `api-token`. Token em memória e `sessionStorage` por aba. Sem token válido, a API responde `code` 403 com "Please log in first." e o painel volta ao login.
- Login: `GET /login-options` (`need_captcha`, `disable_pwd`), `POST /login`, `GET /captcha` quando o login responde `code` 110. OIDC não foi implementado no painel.
- `GET /user/current` devolve `route_names`; `['*']` é administrador. Quem não é administrador vê "Sem permissão", nunca uma lista vazia.
- Listas paginadas: `page` e `page_size` na query, resposta `{list, total}`. Busca e filtros remotos só onde a API aceita (dispositivos: `id`, `hostname`, `ip`, `time_ago`; auditoria: `peer_id`, `from_peer`; demais: `user_id`, `collection_id`). O resto é filtro local sobre a página inteira (`page_size` 1000).
- Gravação com `Updates` do Gorm em dispositivos, endereços e comandos ignora valor zero: limpar um campo de texto ou desligar um booleano não persiste nesses cadastros. Tags gravam todos os campos.
- Comandos do servidor: `GET /rustdesk/cmdList` devolve primeiro os comandos de sistema (sem `id`, não editáveis) e depois os personalizados. `POST /rustdesk/sendCmd` com `target` `21115` (ID) ou `21117` (relay).

## Arquitetura do painel

- React 19, Vite, TypeScript, Tailwind CSS 4, TanStack Router (rotas em `apps/web/src/routes/`, `routeTree.gen.ts` gerado), TanStack Query, TanStack Table, React Hook Form + Zod, Zustand para sessão e tema, Axios.
- `features/<feature>/api`, `components`, `schemas.ts`. `shared/api` concentra cliente HTTP, envelope e tradução de erros. `shared/components/list-screen.tsx` monta listas (busca, filtros, estados, tabela no desktop, lista no celular, rolagem infinita).
- Busca, filtros e ordenação vivem na URL com schema Zod na rota.
- Mutations invalidam as queries relacionadas. Troca ou fim de sessão limpa o cache.

## UI e copy

Visual da marca Singular Pharma, tirado do site institucional. Tokens em `packages/ui/src/styles/globals.css`:

- Azul da marca `#0081bb` (`brand`) só em superfícies sem texto pequeno: painel do login, favicon, foco. Botão, link e item ativo usam `primary` `#0076ab`, a variação que passa AA com texto branco; a faixa do logo na barra lateral usa `brand-strong`, que tem o mesmo valor. No escuro, `primary` é `#3fb0e3` com texto `slate-950`.
- Neutros na escala slate do Tailwind; fundo escuro em `slate-950`, superfícies em `slate-900`.
- Raleway variável. Os algarismos dela são de estilo antigo por padrão, por isso o `body` liga `lnum`; número que se compara (tabela, indicador, data, código) leva `tabular-nums`.
- Raio de 6px nos controles e 8px nas superfícies. Menu e diálogo sólidos, com borda e sombra curta; sem desfoque nem transparência.
- Logos em `apps/web/public/brand/`: `singular-pharma-blue.svg` no fundo claro, `singular-pharma-white.svg` no escuro ou sobre o azul, `singular-mark-white.svg` (só a folha) na barra recolhida. Componentes em `shared/components/brand.tsx`.

Regras de tela e texto:

1. O dado fala primeiro. Sem slogans, subtítulos óbvios ou KPIs inventados.
2. Breadcrumb é o título da seção; detalhe pode ter o nome da entidade em h1.
3. Rota, aba e tabela são flat. Card dentro de card é proibido.
4. Vazio, carregamento e erro são estados distintos; 403 nunca vira vazio.
5. Resultado visível não recebe toast de sucesso. Erro no contexto da ação, preservando o formulário.
6. Português com acentos, sentence case, sem travessão, sem "com sucesso", sem jargão técnico. Sem ícone Sparkles.

Comentário só quando explica um motivo externo que não está no código.
