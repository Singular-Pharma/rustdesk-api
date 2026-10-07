import { getRouteApi } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { formatServerDateTime } from "@/shared/format"
import { useUserNames } from "@/features/users/api/users-api"
import { logins, type Login } from "../api/audit-api"
import { UserFilterSelect } from "./log-filters"
import { LogList } from "./log-list"

const route = getRouteApi("/_authenticated/audit/logins")

const clients: Record<string, string> = {
  webadmin: "Painel",
  webclient: "Cliente web",
  app: "Aplicativo",
}

const methods: Record<string, string> = {
  account: "Senha",
  oauth: "Login externo",
}

function origin(login: Login) {
  return [clients[login.client] ?? login.client, login.platform]
    .filter(Boolean)
    .join(", ")
}

export function LoginList() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const users = useUserNames()
  const userName = (login: Login) =>
    users.name(login.user_id) ?? `Usuário ${login.user_id}`

  const columns: ColumnDef<Login>[] = [
    {
      id: "user",
      header: "Usuário",
      cell: ({ row }) => (
        <span className="font-medium break-words">
          {userName(row.original)}
        </span>
      ),
    },
    {
      id: "origin",
      header: "Origem",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{origin(row.original)}</span>
      ),
    },
    {
      id: "method",
      header: "Forma de acesso",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {methods[row.original.type] ?? row.original.type}
        </span>
      ),
    },
    {
      id: "ip",
      header: "IP",
      cell: ({ row }) => (
        <span className="font-mono text-xs break-all text-muted-foreground">
          {row.original.ip}
        </span>
      ),
    },
    {
      id: "date",
      header: "Data",
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatServerDateTime(row.original.created_at)}
        </span>
      ),
    },
  ]

  return (
    <LogList
      label="Log de login"
      resource={logins}
      params={{ user_id: search.user }}
      filters={
        <UserFilterSelect
          value={search.user}
          onChange={(user) =>
            void navigate({ search: { user }, replace: true })
          }
        />
      }
      filtered={!!search.user}
      clearFilters={() => void navigate({ search: {}, replace: true })}
      columns={columns}
      describe={(login) =>
        `login de ${userName(login)} em ${formatServerDateTime(login.created_at)}`
      }
      mobileRow={(login) => (
        <>
          <span className="font-medium break-words">{userName(login)}</span>
          <span className="text-xs text-muted-foreground">
            {origin(login)}
            {login.ip && (
              <span className="ml-2 font-mono break-all">{login.ip}</span>
            )}
          </span>
          <span className="text-xs tabular-nums">
            {formatServerDateTime(login.created_at)}
          </span>
        </>
      )}
      noun={{ one: "registro de login", many: "registros de login" }}
      emptyMessage={
        search.user ? "Nenhum login desse usuário" : "Nenhum login registrado"
      }
      errorMessage="Não foi possível carregar o log de login. Tente novamente."
      removal={{
        label: "Remover registro",
        title: "Remover registro de login?",
        confirmLabel: "Remover registro",
        pendingLabel: "Removendo…",
        description: (login) => (
          <>
            O registro de <strong>{userName(login)}</strong> sai do log. A
            sessão aberta por esse login continua ativa.
          </>
        ),
        batchConsequence:
          "Os registros saem do log. As sessões abertas continuam ativas.",
      }}
    />
  )
}
