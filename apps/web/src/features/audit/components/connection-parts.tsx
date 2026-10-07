import { ArrowRight } from "lucide-react"
import {
  formatDuration,
  formatServerDateTime,
  serverDateToUnix,
} from "@/shared/format"
import type { Connection } from "../api/audit-api"

export function ConnectionPeers({ connection }: { connection: Connection }) {
  const origin = connection.from_name || connection.from_peer
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5">
      <span className="break-words">
        {origin || <span className="text-muted-foreground">Origem não informada</span>}
        {connection.from_name && connection.from_peer && (
          <span className="ml-1.5 font-mono text-xs text-muted-foreground tabular-nums">
            {connection.from_peer}
          </span>
        )}
      </span>
      <ArrowRight
        aria-label="acessou"
        className="size-3.5 shrink-0 text-muted-foreground"
      />
      <span className="font-mono text-sm tabular-nums">{connection.peer_id}</span>
    </span>
  )
}

export function ConnectionTiming({ connection }: { connection: Connection }) {
  const started = serverDateToUnix(connection.created_at)
  const duration =
    connection.close_time && started ? connection.close_time - started : 0
  return (
    <span className="inline-flex flex-wrap gap-x-2 tabular-nums">
      <span>{formatServerDateTime(connection.created_at)}</span>
      <span className="text-muted-foreground">
        {connection.close_time
          ? formatDuration(Math.max(duration, 0))
          : "Em aberto"}
      </span>
    </span>
  )
}
