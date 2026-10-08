import { useState, type ComponentProps, type ReactNode } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { Trash2 } from "lucide-react"
import { useAdminMutation } from "@/shared/api/mutation"
import { ConfirmDialog } from "@/shared/components/confirm-dialog"
import { ListScreen } from "@/shared/components/list-screen"
import { RowActions } from "@/shared/components/row-actions"
import {
  infinitePageSize,
  nextPageOf,
  useInfiniteRows,
} from "@/shared/list/infinite-list"
import { BatchRemoveButton } from "@/shared/list/batch-remove-button"
import { selectionColumn, useRowSelection } from "@/shared/list/row-selection"
import type { LogResource } from "../api/audit-api"

type Removal<T> = {
  label: string
  title: string
  confirmLabel: string
  pendingLabel: string
  description: (entry: T) => ReactNode
  batchConsequence: string
}

export function LogList<T extends { id: number }>({
  label,
  resource,
  params,
  search,
  filters,
  filtered,
  clearFilters,
  columns,
  describe,
  mobileRow,
  noun,
  emptyMessage,
  errorMessage,
  removal,
}: {
  label: string
  resource: LogResource<T>
  params: Record<string, unknown>
  search?: ComponentProps<typeof ListScreen<T>>["search"]
  filters?: ReactNode
  filtered: boolean
  clearFilters: () => void
  columns: ColumnDef<T>[]
  describe: (entry: T) => string
  mobileRow: (entry: T) => ReactNode
  noun: { one: string; many: string }
  emptyMessage: string
  errorMessage: string
  removal: Removal<T>
}) {
  const query = useInfiniteQuery({
    queryKey: [...resource.key, params],
    queryFn: ({ pageParam, signal }) =>
      resource.list(
        { ...params, page: pageParam, page_size: infinitePageSize },
        signal
      ),
    initialPageParam: 1,
    getNextPageParam: nextPageOf,
  })
  const { rows, total, loadMore } = useInfiniteRows(query)
  const selection = useRowSelection()
  const [removing, setRemoving] = useState<T | null>(null)
  const remove = useAdminMutation(resource.remove, [resource.key])
  const removeMany = useAdminMutation(resource.removeMany, [resource.key])
  const [trackedParams, setTrackedParams] = useState(params)
  if (JSON.stringify(trackedParams) !== JSON.stringify(params)) {
    setTrackedParams(params)
    selection.clear()
  }

  const actions = (entry: T) => (
    <RowActions
      name={describe(entry)}
      actions={[
        {
          label: removal.label,
          icon: Trash2,
          destructive: true,
          onSelect: () => setRemoving(entry),
        },
      ]}
    />
  )

  const table = useReactTable({
    autoResetPageIndex: false,
    data: rows,
    columns: [
      selectionColumn(describe),
      ...columns,
      {
        id: "actions",
        header: () => <span className="sr-only">Ações</span>,
        cell: ({ row }) => actions(row.original),
      },
    ],
    rowCount: total,
    manualPagination: true,
    getRowId: (entry) => String(entry.id),
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    state: { rowSelection: selection.rowSelection },
    onRowSelectionChange: selection.setRowSelection,
  })

  return (
    <ListScreen
      label={label}
      table={table}
      search={search}
      filters={filters}
      primary={
        <BatchRemoveButton
          count={selection.selectedIds.length}
          noun={noun}
          consequence={removal.batchConsequence}
          pending={removeMany.isPending}
          error={removeMany.error}
          onConfirm={(done) =>
            removeMany.mutate(selection.selectedIds, {
              onSuccess: () => {
                selection.clear()
                done()
              },
            })
          }
          onReset={() => removeMany.reset()}
        />
      }
      filtered={filtered}
      clearFilters={clearFilters}
      loading={query.isPending}
      refreshing={query.isFetching && !query.isFetchingNextPage}
      error={query.isError ? query.error : null}
      errorMessage={errorMessage}
      refresh={() => void query.refetch()}
      emptyMessage={emptyMessage}
      loadMore={loadMore}
      mobileRow={(entry) => (
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm">
            {mobileRow(entry)}
          </div>
          {actions(entry)}
        </div>
      )}
    >
      {removing && (
        <ConfirmDialog
          title={removal.title}
          description={removal.description(removing)}
          confirmLabel={removal.confirmLabel}
          pendingLabel={removal.pendingLabel}
          pending={remove.isPending}
          error={remove.error}
          errorFallback="Não foi possível concluir. Tente novamente."
          onConfirm={() =>
            remove.mutate(removing.id, {
              onSuccess: () => {
                selection.setRowSelection((current) => {
                  const next = { ...current }
                  delete next[String(removing.id)]
                  return next
                })
                setRemoving(null)
              },
            })
          }
          onClose={() => {
            setRemoving(null)
            remove.reset()
          }}
        />
      )}
    </ListScreen>
  )
}
