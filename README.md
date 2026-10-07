# Acesso remoto Singular

Servidor de API e painel administrativo do RustDesk usados pela Singular, a partir de um fork do [lejianwen/rustdesk-api](https://github.com/lejianwen/rustdesk-api).

| Pasta         | O que é                                                      | Deploy                                            |
| ------------- | ------------------------------------------------------------ | ------------------------------------------------- |
| `apps/api`    | API Go usada pelo cliente RustDesk e pelo painel             | Dokploy (sp1), `apps/api/dokploy/docker-compose.yml` |
| `apps/web`    | Painel administrativo em React                               | Vercel, root `apps/web`                           |
| `packages/ui` | Componentes e tema compartilhados                            | Não é publicado                                   |

A documentação original da API, em chinês e inglês, está em [apps/api/README.md](apps/api/README.md) e [apps/api/README_EN.md](apps/api/README_EN.md).

## Desenvolvimento do painel

```bash
pnpm install --frozen-lockfile
pnpm dev
```

O painel abre em `http://localhost:4300` e encaminha `/api/admin` para `API_PROXY_TARGET` (padrão: a API de produção). Qualquer alteração feita no painel local grava em produção. Para testar cadastro, edição ou envio de comando, rode a API localmente e configure `apps/web/.env.local`:

```bash
API_PROXY_TARGET=http://localhost:21114
```

Verificação: `pnpm typecheck`, `pnpm lint`, `pnpm build` e `pnpm format:check`.

## Telas

Somente administradores entram. Início, dispositivos, usuários, grupos de usuário e de dispositivo, catálogos de endereços com regras de compartilhamento, endereços, tags, auditoria (conexões, arquivos, log de login, sessões, compartilhamentos) e servidor (configurações e comandos).
