import { Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { LoadingLine } from "@/shared/components/loading-line"
import { Kpi } from "@/shared/components/kpi"
import { Panel } from "@/shared/components/panel"
import { RequestError } from "@/shared/components/request-error"
import { lastSeenWindows, useDeviceCount } from "@/features/devices/api/devices-api"
import { useUsers } from "@/features/users/api/users-api"
import { connectionKind, connections } from "@/features/audit/api/audit-api"
import {
  ConnectionPeers,
  ConnectionTiming,
} from "@/features/audit/components/connection-parts"

const recentConnectionCount = 8

function count(query: { data?: number; isPending: boolean; isError: boolean }) {
  if (query.isError) return "Indisponível"
  if (query.isPending) return "…"
  return (query.data ?? 0).toLocaleString("pt-BR")
}

function RecentConnections() {
  const recent = useQuery({
    queryKey: [...connections.key, "recent"],
    queryFn: ({ signal }) =>
      connections.list({ page_size: recentConnectionCount }, signal),
    refetchInterval: 60_000,
  })
  return (
    <Panel
      title="Conexões recentes"
      action={
        <Button
          variant="ghost"
          size="sm"
          render={<Link to="/audit/connections" />}
          nativeButton={false}
          role="link"
        >
          Ver todas
        </Button>
      }
    >
      {recent.isPending ? (
        <LoadingLine label="Carregando conexões…" className="py-6" />
      ) : recent.isError ? (
        <RequestError
          error={recent.error}
          fallback="Não foi possível carregar as conexões. Tente novamente."
          retry={() => void recent.refetch()}
        />
      ) : recent.data.list.length ? (
        <ul className="-my-3 divide-y">
          {recent.data.list.map((connection) => (
            <li
              key={connection.id}
              className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <ConnectionPeers connection={connection} />
                <span className="text-xs text-muted-foreground">
                  {connectionKind(connection)}
                </span>
              </div>
              <span className="text-xs sm:text-right">
                <ConnectionTiming connection={connection} />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nenhuma conexão registrada
        </p>
      )}
    </Panel>
  )
}

export function HomePage() {
  const online = useDeviceCount({ time_ago: lastSeenWindows.online })
  const activeToday = useDeviceCount({ time_ago: lastSeenWindows.today })
  const allDevices = useDeviceCount({})
  const users = useUsers()
  const userCount = { ...users, data: users.data?.length }
  return (
    <div className="flex flex-col gap-8">
      <section
        aria-label="Indicadores"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Kpi label="Online agora" value={count(online)} />
        <Kpi label="Ativos nas últimas 24 h" value={count(activeToday)} />
        <Kpi label="Dispositivos" value={count(allDevices)} />
        <Kpi label="Usuários" value={count(userCount)} />
      </section>
      <RecentConnections />
    </div>
  )
}
