import { getRouteApi } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowRight } from "lucide-react"
import { formatBytes, formatServerDateTime } from "@/shared/format"
import { useDebouncedValue } from "@/shared/list/use-debounced-value"
import {
  fileTransfers,
  fileTransferToRemote,
  type FileTransfer,
} from "../api/audit-api"
import type { PeerSearch } from "../schemas"
import { OriginFilter } from "./log-filters"
import { LogList } from "./log-list"

const route = getRouteApi("/_authenticated/audit/files")

function direction(transfer: FileTransfer) {
  return transfer.type === fileTransferToRemote
    ? "Enviado ao dispositivo acessado"
    : "Baixado do dispositivo acessado"
}

function TransferPeers({ transfer }: { transfer: FileTransfer }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2">
      <span className="break-words">
        {transfer.from_name || transfer.from_peer}
      </span>
      <ArrowRight
        aria-label="acessou"
        className="size-3.5 shrink-0 text-muted-foreground"
      />
      <span className="font-mono text-sm tabular-nums">{transfer.peer_id}</span>
    </span>
  )
}

function TransferContent({ transfer }: { transfer: FileTransfer }) {
  const totalSize = transfer.info.reduce((sum, [, size]) => sum + size, 0)
  const count = transfer.is_file ? 1 : transfer.num || transfer.info.length
  return (
    <div className="min-w-0">
      <span className="block font-mono text-xs break-all">
        {transfer.path}
      </span>
      <span className="mt-0.5 block text-xs text-muted-foreground tabular-nums">
        {transfer.is_file
          ? "Arquivo"
          : `Pasta com ${count} ${count === 1 ? "arquivo" : "arquivos"}`}
        {totalSize > 0 && `, ${formatBytes(totalSize)}`}
      </span>
    </div>
  )
}

const columns: ColumnDef<FileTransfer>[] = [
  {
    id: "content",
    header: "Arquivo",
    cell: ({ row }) => <TransferContent transfer={row.original} />,
  },
  {
    id: "direction",
    header: "Direção",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{direction(row.original)}</span>
    ),
  },
  {
    id: "peers",
    header: "Conexão",
    cell: ({ row }) => <TransferPeers transfer={row.original} />,
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

function describe(transfer: FileTransfer) {
  return `transferência de ${transfer.path || "arquivo"}`
}

export function FileTransferList() {
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
      label="Arquivos"
      resource={fileTransfers}
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
      mobileRow={(transfer) => (
        <>
          <TransferContent transfer={transfer} />
          <TransferPeers transfer={transfer} />
          <span className="text-xs text-muted-foreground">
            {direction(transfer)},{" "}
            <span className="tabular-nums">
              {formatServerDateTime(transfer.created_at)}
            </span>
          </span>
        </>
      )}
      noun={{ one: "registro de arquivo", many: "registros de arquivo" }}
      emptyMessage={
        filtered
          ? "Nenhuma transferência encontrada"
          : "Nenhuma transferência registrada"
      }
      errorMessage="Não foi possível carregar as transferências. Tente novamente."
      removal={{
        label: "Remover registro",
        title: "Remover registro de transferência?",
        confirmLabel: "Remover registro",
        pendingLabel: "Removendo…",
        description: (transfer) => (
          <>
            O registro da {describe(transfer)} sai da auditoria. Os arquivos não
            são afetados.
          </>
        ),
        batchConsequence:
          "Os registros saem da auditoria e não podem ser recuperados.",
      }}
    />
  )
}
