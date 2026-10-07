import { useState } from "react"
import { getRouteApi, Link } from "@tanstack/react-router"
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { Eye, MonitorUp, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useAdminMutation } from "@/shared/api/mutation"
import { ListScreen } from "@/shared/components/list-screen"
import { RowActions } from "@/shared/components/row-actions"
import { FilterSelect } from "@/shared/list/filter-select"
import { useInfiniteRows } from "@/shared/list/infinite-list"
import { BatchRemoveButton } from "@/shared/list/batch-remove-button"
import { selectionColumn, useRowSelection } from "@/shared/list/row-selection"
import { useDebouncedValue } from "@/shared/list/use-debounced-value"
import { useGroupNames } from "@/features/groups/api/groups-api"
import {
  deviceName,
  devices,
  devicesKey,
  remoteLink,
  useDeviceList,
  type Device,
} from "../api/devices-api"
import type { DeviceSearch } from "../schemas"
import { LastSeen } from "./last-seen"
import { RemoveDeviceDialog } from "./remove-device-dialog"

const route = getRouteApi("/_authenticated/devices/")

const seenOptions = [
  { value: "all", label: "Qualquer atividade" },
  { value: "online", label: "Online agora" },
  { value: "today", label: "Ativos nas últimas 24 h" },
  { value: "stale", label: "Sem contato há 30 dias" },
]

function DeviceIdentity({ device }: { device: Device }) {
  const name = deviceName(device)
  return (
    <div className="min-w-0">
      <Link
        to="/devices/$deviceId"
        params={{ deviceId: String(device.row_id) }}
        className="block w-fit max-w-full font-medium break-words underline-offset-4 hover:underline"
      >
        {name}
      </Link>
      {name !== device.id && (
        <span className="mt-0.5 block font-mono text-xs break-all text-muted-foreground tabular-nums">
          {device.id}
        </span>
      )}
    </div>
  )
}

export function DeviceList() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const settledQuery = useDebouncedValue(search.q)
  const query = useDeviceList({ ...search, q: settledQuery })
  const { rows, total, loadMore } = useInfiniteRows(query)
  const groups = useGroupNames("device")
  const selection = useRowSelection()
  const [removing, setRemoving] = useState<Device | null>(null)
  const removeSelected = useAdminMutation(
    (rowIds: number[]) => devices.removeMany({ row_ids: rowIds }),
    [devicesKey]
  )
  const hasFilters = !!(search.q || search.seen)

  function filter(patch: Partial<DeviceSearch>) {
    selection.clear()
    void navigate({
      search: (previous) => ({ ...previous, ...patch }),
      replace: true,
      resetScroll: false,
    })
  }

  const actions = (device: Device) => (
    <RowActions
      name={deviceName(device)}
      actions={[
        {
          label: "Conectar",
          icon: MonitorUp,
          render: <a href={remoteLink(device)} />,
        },
        {
          label: "Ver detalhes",
          icon: Eye,
          render: (
            <Link
              to="/devices/$deviceId"
              params={{ deviceId: String(device.row_id) }}
            />
          ),
        },
        {
          label: "Editar dispositivo",
          icon: Pencil,
          render: (
            <Link
              to="/devices/$deviceId/edit"
              params={{ deviceId: String(device.row_id) }}
            />
          ),
        },
        {
          label: "Remover",
          icon: Trash2,
          destructive: true,
          onSelect: () => setRemoving(device),
        },
      ]}
    />
  )

  const muted = (text: string) => (
    <span className="break-words text-muted-foreground">{text}</span>
  )

  const columns: ColumnDef<Device>[] = [
    selectionColumn(deviceName),
    {
      id: "device",
      header: "Dispositivo",
      cell: ({ row }) => <DeviceIdentity device={row.original} />,
    },
    {
      id: "username",
      header: "Usuário",
      cell: ({ row }) => muted(row.original.username),
    },
    {
      id: "version",
      header: "Versão",
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums">
          {row.original.version}
        </span>
      ),
    },
    {
      id: "lastSeen",
      header: "Último online",
      cell: ({ row }) => <LastSeen seconds={row.original.last_online_time} />,
    },
    {
      id: "ip",
      header: "IP",
      cell: ({ row }) => (
        <span className="font-mono text-xs break-all text-muted-foreground">
          {row.original.last_online_ip}
        </span>
      ),
    },
    {
      id: "group",
      header: "Grupo",
      cell: ({ row }) => muted(groups.name(row.original.group_id) ?? ""),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => actions(row.original),
    },
  ]
  const table = useReactTable({
    data: rows,
    columns,
    rowCount: total,
    manualPagination: true,
    getRowId: (device) => String(device.row_id),
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    state: { rowSelection: selection.rowSelection },
    onRowSelectionChange: selection.setRowSelection,
  })

  return (
    <ListScreen
      label="Dispositivos"
      table={table}
      search={{
        value: search.q ?? "",
        placeholder: "Buscar por ID, nome do computador ou IP",
        onChange: (q) => filter({ q: q || undefined }),
      }}
      filters={
        <FilterSelect
          label="Atividade"
          options={seenOptions}
          value={search.seen}
          onChange={(seen) => filter({ seen: seen as DeviceSearch["seen"] })}
        />
      }
      primary={
        <>
          <BatchRemoveButton
            count={selection.selectedIds.length}
            noun={{ one: "dispositivo", many: "dispositivos" }}
            consequence="Os dispositivos saem da lista. Os que continuarem com o aplicativo instalado e conectado voltam a aparecer."
            pending={removeSelected.isPending}
            error={removeSelected.error}
            onConfirm={(done) =>
              removeSelected.mutate(selection.selectedIds, {
                onSuccess: () => {
                  selection.clear()
                  done()
                },
              })
            }
            onReset={() => removeSelected.reset()}
          />
          <Button
            render={<Link to="/devices/new" />}
            nativeButton={false}
            role="link"
          >
            <Plus data-icon="inline-start" />
            Novo dispositivo
          </Button>
        </>
      }
      filtered={hasFilters}
      clearFilters={() => filter({ q: undefined, seen: undefined })}
      loading={query.isPending}
      refreshing={query.isFetching && !query.isFetchingNextPage}
      error={query.isError ? query.error : null}
      errorMessage="Não foi possível carregar os dispositivos. Tente novamente."
      refresh={() => void query.refetch()}
      emptyMessage={
        hasFilters
          ? "Nenhum dispositivo encontrado"
          : "Nenhum dispositivo cadastrado"
      }
      loadMore={loadMore}
      mobileRow={(device) => (
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <DeviceIdentity device={device} />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <LastSeen seconds={device.last_online_time} />
              {device.username && (
                <span className="text-muted-foreground">{device.username}</span>
              )}
              {groups.name(device.group_id) && (
                <span className="text-muted-foreground">
                  {groups.name(device.group_id)}
                </span>
              )}
            </div>
          </div>
          {actions(device)}
        </div>
      )}
    >
      {removing && (
        <RemoveDeviceDialog
          device={removing}
          onClose={() => setRemoving(null)}
        />
      )}
    </ListScreen>
  )
}
