import { getRouteApi } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { useDebouncedValue } from "@/shared/list/use-debounced-value"
import { connectionKind, connections, type Connection } from "../api/audit-api"
import type { PeerSearch } from "../schemas"
import { ConnectionPeers, ConnectionTiming } from "./connection-parts"
import { OriginFilter } from "./log-filters"
import { LogList } from "./log-list"

const route = getRouteApi("/_authenticated/audit/connections")

const columns: ColumnDef<Connection>[] = [
  {
    id: "peers",
    header: "Conexão",
    cell: ({ row }) => <ConnectionPeers connection={row.original} />,
  },
  {
    id: "kind",
    header: "Tipo",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {connectionKind(row.original)}
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
    id: "timing",
    header: "Início e duração",
    cell: ({ row }) => <ConnectionTiming connection={row.original} />,
  },
]

function describe(connection: Connection) {
  return `conexão de ${connection.from_name || connection.from_peer || "origem não informada"} com ${connection.peer_id}`
}

export function ConnectionList() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const peerId = useDebouncedValue(search.q?.trim())
  const fromPeer = useDebouncedValue(search.from?.trim())
  const filtered = !!(search.q || search.from)

  function filter(patch: Partial<PeerSearch>) {
    void navigate({
      search: (previous) => ({ ...previous, ...patch }),
      replace: true,
      resetScroll: false,
    })
  }

  return (
    <LogList
      label="Conexões"
      resource={connections}
      params={{ peer_id: peerId, from_peer: fromPeer }}
      search={{
        value: search.q ?? "",
        placeholder: "ID do dispositivo acessado",
        onChange: (q) => filter({ q: q || undefined }),
      }}
      filters={
        <OriginFilter
          value={search.from}
          onChange={(from) => filter({ from })}
        />
      }
      filtered={filtered}
      clearFilters={() => filter({ q: undefined, from: undefined })}
      columns={columns}
      describe={describe}
      mobileRow={(connection) => (
        <>
          <ConnectionPeers connection={connection} />
          <span className="text-xs text-muted-foreground">
            {connectionKind(connection)}
          </span>
          <span className="text-xs">
            <ConnectionTiming connection={connection} />
          </span>
        </>
      )}
      noun={{ one: "registro de conexão", many: "registros de conexão" }}
      emptyMessage={
        filtered ? "Nenhuma conexão encontrada" : "Nenhuma conexão registrada"
      }
      errorMessage="Não foi possível carregar as conexões. Tente novamente."
      removal={{
        label: "Remover registro",
        title: "Remover registro de conexão?",
        confirmLabel: "Remover registro",
        pendingLabel: "Removendo…",
        description: (connection) => (
          <>
            O registro da {describe(connection)} sai da auditoria. A conexão em
            si não é afetada.
          </>
        ),
        batchConsequence:
          "Os registros saem da auditoria e não podem ser recuperados.",
      }}
    />
  )
}
