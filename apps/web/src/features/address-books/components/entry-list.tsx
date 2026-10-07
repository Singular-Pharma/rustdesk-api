import { useState } from "react"
import { getRouteApi } from "@tanstack/react-router"
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { MonitorUp, Pencil, Plus, Trash2 } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { useAdminMutation } from "@/shared/api/mutation"
import { ConfirmDialog } from "@/shared/components/confirm-dialog"
import { ListScreen } from "@/shared/components/list-screen"
import { RowActions } from "@/shared/components/row-actions"
import { FilterSelect } from "@/shared/list/filter-select"
import { useInfiniteRows } from "@/shared/list/infinite-list"
import { useDebouncedValue } from "@/shared/list/use-debounced-value"
import { remoteLink } from "@/features/devices/api/devices-api"
import { useUserNames } from "@/features/users/api/users-api"
import { UserFilterSelect } from "@/features/users/components/user-filter-select"
import {
  entriesKey,
  entryName,
  platforms,
  removeEntry,
  useCollectionOptions,
  useEntries,
  type Entry,
  type EntryFilters,
} from "../api/address-books-api"
import type { EntrySearch } from "../schemas"
import { EntryDialog } from "./entry-dialog"

const route = getRouteApi("/_authenticated/address-book-entries")

function remoteFilters(search: EntrySearch, query?: string): EntryFilters {
  const target = query?.trim()
  return {
    user_id: search.user,
    collection_id: search.collection,
    ...(target &&
      (/^\d[\d\s]*$/.test(target)
        ? { id: target.replace(/\s/g, "") }
        : { hostname: target })),
  }
}

function platformLabel(platform: string) {
  return platforms.find((option) => option.value === platform)?.label ?? platform
}

function EntryIdentity({ entry }: { entry: Entry }) {
  const name = entryName(entry)
  return (
    <div className="min-w-0">
      <span className="block font-medium break-words">{name}</span>
      {name !== entry.id && (
        <span className="mt-0.5 block font-mono text-xs break-all text-muted-foreground tabular-nums">
          {entry.id}
        </span>
      )}
    </div>
  )
}

function EntryTags({ entry }: { entry: Entry }) {
  if (!entry.tags.length) return null
  return (
    <div className="flex flex-wrap gap-1">
      {entry.tags.map((tag) => (
        <Badge key={tag} variant="outline">
          {tag}
        </Badge>
      ))}
    </div>
  )
}

function RemoveEntryDialog({
  entry,
  onClose,
}: {
  entry: Entry
  onClose: () => void
}) {
  const remove = useAdminMutation(() => removeEntry(entry), [entriesKey])
  return (
    <ConfirmDialog
      title="Remover endereço?"
      description={
        <>
          <strong>{entryName(entry)}</strong> sai do catálogo. O dispositivo
          continua cadastrado.
        </>
      }
      confirmLabel="Remover endereço"
      pendingLabel="Removendo…"
      pending={remove.isPending}
      error={remove.error}
      errorFallback="Não foi possível remover o endereço. Tente novamente."
      onConfirm={() => remove.mutate(undefined, { onSuccess: onClose })}
      onClose={onClose}
    />
  )
}

export function EntryList() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const settledQuery = useDebouncedValue(search.q)
  const query = useEntries(remoteFilters(search, settledQuery))
  const { rows, total, loadMore } = useInfiniteRows(query)
  const users = useUserNames()
  const collections = useCollectionOptions(search.user)
  const [editing, setEditing] = useState<Entry | "new" | null>(null)
  const [removing, setRemoving] = useState<Entry | null>(null)
  const hasFilters = !!(
    search.q ||
    search.user ||
    search.collection !== undefined
  )
  const collectionName = (entry: Entry) =>
    collections.name(entry.collection_id) ?? ""

  function filter(patch: Partial<EntrySearch>) {
    void navigate({
      search: (previous) => ({ ...previous, ...patch }),
      replace: true,
      resetScroll: false,
    })
  }

  const actions = (entry: Entry) => (
    <RowActions
      name={entryName(entry)}
      actions={[
        {
          label: "Conectar",
          icon: MonitorUp,
          render: <a href={remoteLink(entry)} />,
        },
        {
          label: "Editar endereço",
          icon: Pencil,
          onSelect: () => setEditing(entry),
        },
        {
          label: "Remover",
          icon: Trash2,
          destructive: true,
          onSelect: () => setRemoving(entry),
        },
      ]}
    />
  )

  const muted = (text: string) => (
    <span className="break-words text-muted-foreground">{text}</span>
  )

  const columns: ColumnDef<Entry>[] = [
    {
      id: "entry",
      header: "Dispositivo",
      cell: ({ row }) => <EntryIdentity entry={row.original} />,
    },
    {
      id: "platform",
      header: "Sistema",
      cell: ({ row }) => muted(platformLabel(row.original.platform)),
    },
    {
      id: "tags",
      header: "Tags",
      cell: ({ row }) => <EntryTags entry={row.original} />,
    },
    {
      id: "collection",
      header: "Catálogo",
      cell: ({ row }) => muted(collectionName(row.original)),
    },
    {
      id: "owner",
      header: "Dono",
      cell: ({ row }) => muted(users.name(row.original.user_id) ?? ""),
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
    getRowId: (entry) => String(entry.row_id),
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <ListScreen
      label="Endereços"
      table={table}
      search={{
        value: search.q ?? "",
        placeholder: "Buscar por ID ou nome do computador",
        onChange: (q) => filter({ q: q || undefined }),
      }}
      filters={
        <>
          <UserFilterSelect
            value={search.user}
            onChange={(user) => filter({ user, collection: undefined })}
          />
          <FilterSelect
            label="Catálogo"
            options={[
              { value: "all", label: "Todos os catálogos" },
              ...collections.options,
            ]}
            value={
              search.collection === undefined
                ? undefined
                : String(search.collection)
            }
            onChange={(collection) =>
              filter({
                collection:
                  collection === undefined ? undefined : Number(collection),
              })
            }
          />
        </>
      }
      primary={
        <Button onClick={() => setEditing("new")}>
          <Plus data-icon="inline-start" />
          Novo endereço
        </Button>
      }
      filtered={hasFilters}
      clearFilters={() =>
        filter({ q: undefined, user: undefined, collection: undefined })
      }
      loading={query.isPending}
      refreshing={query.isFetching && !query.isFetchingNextPage}
      error={query.isError ? query.error : null}
      errorMessage="Não foi possível carregar os endereços. Tente novamente."
      refresh={() => void query.refetch()}
      emptyMessage={
        hasFilters ? "Nenhum endereço encontrado" : "Nenhum endereço cadastrado"
      }
      loadMore={loadMore}
      mobileRow={(entry) => (
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <EntryIdentity entry={entry} />
            <span className="text-xs text-muted-foreground">
              {[
                users.name(entry.user_id),
                collectionName(entry),
                platformLabel(entry.platform),
              ]
                .filter(Boolean)
                .join(", ")}
            </span>
            <EntryTags entry={entry} />
          </div>
          {actions(entry)}
        </div>
      )}
    >
      {editing && (
        <EntryDialog
          entry={editing === "new" ? undefined : editing}
          defaults={{ userId: search.user, collectionId: search.collection }}
          onClose={() => setEditing(null)}
        />
      )}
      {removing && (
        <RemoveEntryDialog entry={removing} onClose={() => setRemoving(null)} />
      )}
    </ListScreen>
  )
}
