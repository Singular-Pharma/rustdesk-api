import { useState } from "react"
import { getRouteApi, Link } from "@tanstack/react-router"
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { Contact, Pencil, Plus, Share2, Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { ListScreen } from "@/shared/components/list-screen"
import { RowActions } from "@/shared/components/row-actions"
import { matchesQuery } from "@/shared/list/search"
import { useUserNames } from "@/features/users/api/users-api"
import { UserFilterSelect } from "@/features/users/components/user-filter-select"
import {
  useCollections,
  useRules,
  type Collection,
} from "../api/address-books-api"
import type { CollectionSearch } from "../schemas"
import { CollectionDialog, RemoveCollectionDialog } from "./collection-dialogs"

const route = getRouteApi("/_authenticated/address-books/")

function sharingLabel(count: number) {
  if (!count) return "Não compartilhado"
  return count === 1 ? "1 regra" : `${count} regras`
}

export function CollectionList() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const collections = useCollections()
  const allRules = useRules()
  const users = useUserNames()
  const [editing, setEditing] = useState<Collection | "new" | null>(null)
  const [removing, setRemoving] = useState<Collection | null>(null)
  const ruleCount = new Map<number, number>()
  for (const rule of allRules.data ?? [])
    ruleCount.set(
      rule.collection_id,
      (ruleCount.get(rule.collection_id) ?? 0) + 1
    )
  const hasFilters = !!(search.q || search.user)
  const ownerName = (collection: Collection) =>
    users.name(collection.user_id) ?? "Usuário removido"
  const rows = (collections.data ?? [])
    .filter(
      (collection) =>
        matchesQuery(collection.name, search.q) &&
        (!search.user || collection.user_id === search.user)
    )
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))

  function filter(patch: Partial<CollectionSearch>) {
    void navigate({
      search: (previous) => ({ ...previous, ...patch }),
      replace: true,
      resetScroll: false,
    })
  }

  const detailLink = (collection: Collection) => (
    <Link
      to="/address-books/$collectionId"
      params={{ collectionId: String(collection.id) }}
    />
  )

  const actions = (collection: Collection) => (
    <RowActions
      name={collection.name}
      actions={[
        {
          label: "Compartilhamento",
          icon: Share2,
          render: detailLink(collection),
        },
        {
          label: "Ver endereços",
          icon: Contact,
          render: (
            <Link
              to="/address-book-entries"
              search={{
                user: collection.user_id,
                collection: collection.id,
              }}
            />
          ),
        },
        {
          label: "Editar catálogo",
          icon: Pencil,
          onSelect: () => setEditing(collection),
        },
        {
          label: "Remover",
          icon: Trash2,
          destructive: true,
          onSelect: () => setRemoving(collection),
        },
      ]}
    />
  )

  const columns: ColumnDef<Collection>[] = [
    {
      id: "name",
      header: "Catálogo",
      cell: ({ row }) => (
        <Link
          to="/address-books/$collectionId"
          params={{ collectionId: String(row.original.id) }}
          className="font-medium break-words underline-offset-4 hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      id: "owner",
      header: "Dono",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{ownerName(row.original)}</span>
      ),
    },
    {
      id: "sharing",
      header: "Compartilhamento",
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular-nums">
          {allRules.isSuccess
            ? sharingLabel(ruleCount.get(row.original.id) ?? 0)
            : ""}
        </span>
      ),
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
    getRowId: (collection) => String(collection.id),
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <ListScreen
      label="Catálogos de endereços"
      table={table}
      search={{
        value: search.q ?? "",
        placeholder: "Buscar por nome",
        onChange: (q) => filter({ q: q || undefined }),
      }}
      filters={
        <UserFilterSelect
          value={search.user}
          onChange={(user) => filter({ user })}
        />
      }
      primary={
        <Button onClick={() => setEditing("new")}>
          <Plus data-icon="inline-start" />
          Novo catálogo
        </Button>
      }
      filtered={hasFilters}
      clearFilters={() => filter({ q: undefined, user: undefined })}
      loading={collections.isPending}
      refreshing={collections.isFetching}
      error={collections.isError ? collections.error : null}
      errorMessage="Não foi possível carregar os catálogos. Tente novamente."
      refresh={() => {
        void collections.refetch()
        void allRules.refetch()
      }}
      emptyMessage={
        hasFilters ? "Nenhum catálogo encontrado" : "Nenhum catálogo cadastrado"
      }
      mobileRow={(collection) => (
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Link
              to="/address-books/$collectionId"
              params={{ collectionId: String(collection.id) }}
              className="w-fit font-medium break-words underline-offset-4 hover:underline"
            >
              {collection.name}
            </Link>
            <span className="text-xs text-muted-foreground">
              {ownerName(collection)}
              {allRules.isSuccess &&
                `, ${sharingLabel(ruleCount.get(collection.id) ?? 0).toLocaleLowerCase("pt-BR")}`}
            </span>
          </div>
          {actions(collection)}
        </div>
      )}
    >
      {editing && (
        <CollectionDialog
          collection={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {removing && (
        <RemoveCollectionDialog
          collection={removing}
          onClose={() => setRemoving(null)}
        />
      )}
    </ListScreen>
  )
}
