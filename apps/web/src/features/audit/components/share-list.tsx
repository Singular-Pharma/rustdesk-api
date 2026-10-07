import { useState } from "react"
import { getRouteApi } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@workspace/ui/components/badge"
import {
  formatServerDateTime,
  formatUnixTime,
  serverDateToUnix,
} from "@/shared/format"
import { useUserNames } from "@/features/users/api/users-api"
import { shares, type Share } from "../api/audit-api"
import { UserFilterSelect } from "./log-filters"
import { LogList } from "./log-list"

const route = getRouteApi("/_authenticated/audit/shares")

const passwordTypes: Record<string, string> = {
  once: "Senha de uso único",
  fixed: "Senha fixa",
}

function Validity({ share, now }: { share: Share; now: number }) {
  if (!share.expire) return <span>Sem validade</span>
  const expiresAt = serverDateToUnix(share.created_at) + share.expire
  if (expiresAt * 1000 < now)
    return <Badge variant="outline">Expirado</Badge>
  return <span className="tabular-nums">{formatUnixTime(expiresAt)}</span>
}

export function ShareList() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const users = useUserNames()
  const [now] = useState(Date.now)
  const userName = (share: Share) =>
    users.name(share.user_id) ?? `Usuário ${share.user_id}`

  const columns: ColumnDef<Share>[] = [
    {
      id: "device",
      header: "Dispositivo",
      cell: ({ row }) => (
        <span className="font-mono text-sm tabular-nums">
          {row.original.peer_id}
        </span>
      ),
    },
    {
      id: "user",
      header: "Compartilhado por",
      cell: ({ row }) => (
        <span className="break-words">{userName(row.original)}</span>
      ),
    },
    {
      id: "password",
      header: "Senha",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {passwordTypes[row.original.password_type] ??
            row.original.password_type}
        </span>
      ),
    },
    {
      id: "created",
      header: "Criado em",
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatServerDateTime(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "validity",
      header: "Válido até",
      cell: ({ row }) => <Validity share={row.original} now={now} />,
    },
  ]

  return (
    <LogList
      label="Compartilhamentos"
      resource={shares}
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
      describe={(share) => `compartilhamento de ${share.peer_id}`}
      mobileRow={(share) => (
        <>
          <span className="font-mono tabular-nums">{share.peer_id}</span>
          <span className="text-xs text-muted-foreground">
            {userName(share)},{" "}
            {passwordTypes[share.password_type] ?? share.password_type}
          </span>
          <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            Válido até <Validity share={share} now={now} />
          </span>
        </>
      )}
      noun={{ one: "compartilhamento", many: "compartilhamentos" }}
      emptyMessage={
        search.user
          ? "Nenhum compartilhamento desse usuário"
          : "Nenhum compartilhamento registrado"
      }
      errorMessage="Não foi possível carregar os compartilhamentos. Tente novamente."
      removal={{
        label: "Remover compartilhamento",
        title: "Remover compartilhamento?",
        confirmLabel: "Remover compartilhamento",
        pendingLabel: "Removendo…",
        description: (share) => (
          <>
            O link de acesso ao dispositivo{" "}
            <strong className="font-mono">{share.peer_id}</strong> deixa de
            funcionar.
          </>
        ),
        batchConsequence: "Os links de acesso deixam de funcionar.",
      }}
    />
  )
}
