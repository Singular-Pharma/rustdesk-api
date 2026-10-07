import { useState } from "react"
import { getRouteApi } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@workspace/ui/components/badge"
import { formatServerDateTime, formatUnixTime } from "@/shared/format"
import { useUserNames } from "@/features/users/api/users-api"
import { sessions, type Session } from "../api/audit-api"
import { UserFilterSelect } from "@/features/users/components/user-filter-select"
import { LogList } from "./log-list"

const route = getRouteApi("/_authenticated/audit/sessions")

function Expiry({ session, now }: { session: Session; now: number }) {
  if (session.expired_at > 0 && session.expired_at * 1000 < now)
    return <Badge variant="outline">Expirada</Badge>
  return (
    <span className="tabular-nums">
      {session.expired_at ? formatUnixTime(session.expired_at) : "Sem validade"}
    </span>
  )
}

function Device({ session }: { session: Session }) {
  return session.device_id ? (
    <span className="font-mono text-sm tabular-nums">{session.device_id}</span>
  ) : (
    <span className="text-muted-foreground">Painel ou navegador</span>
  )
}

export function SessionList() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const users = useUserNames()
  const [now] = useState(Date.now)
  const userName = (session: Session) =>
    users.name(session.user_id) ?? `Usuário ${session.user_id}`

  const columns: ColumnDef<Session>[] = [
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
      id: "device",
      header: "Dispositivo",
      cell: ({ row }) => <Device session={row.original} />,
    },
    {
      id: "created",
      header: "Aberta em",
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatServerDateTime(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "expiry",
      header: "Expira em",
      cell: ({ row }) => <Expiry session={row.original} now={now} />,
    },
  ]

  return (
    <LogList
      label="Sessões"
      resource={sessions}
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
      describe={(session) => `sessão de ${userName(session)}`}
      mobileRow={(session) => (
        <>
          <span className="font-medium break-words">{userName(session)}</span>
          <span className="text-xs">
            <Device session={session} />
          </span>
          <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            Expira em <Expiry session={session} now={now} />
          </span>
        </>
      )}
      noun={{ one: "sessão", many: "sessões" }}
      emptyMessage={
        search.user ? "Nenhuma sessão desse usuário" : "Nenhuma sessão aberta"
      }
      errorMessage="Não foi possível carregar as sessões. Tente novamente."
      removal={{
        label: "Encerrar sessão",
        title: "Encerrar sessão?",
        confirmLabel: "Encerrar sessão",
        pendingLabel: "Encerrando…",
        description: (session) => (
          <>
            <strong>{userName(session)}</strong> precisa entrar de novo{" "}
            {session.device_id
              ? `no dispositivo ${session.device_id}`
              : "no painel ou navegador"}
            . Se for a sua sessão atual, você sai do painel.
          </>
        ),
        batchConsequence:
          "Os usuários precisam entrar de novo nesses dispositivos. Se a sua sessão atual estiver entre elas, você sai do painel.",
      }}
    />
  )
}
