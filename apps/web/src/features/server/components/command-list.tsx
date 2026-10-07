import { useState } from "react"
import { getRouteApi } from "@tanstack/react-router"
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { Pencil, Plus, Send, Trash2 } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { ListScreen } from "@/shared/components/list-screen"
import { RowActions, type RowAction } from "@/shared/components/row-actions"
import { FilterSelect } from "@/shared/list/filter-select"
import { matchesQuery } from "@/shared/list/search"
import {
  targetLabel,
  targetOptions,
  useCommands,
  type Command,
} from "../api/server-api"
import type { CommandSearch } from "../schemas"
import {
  CommandDialog,
  RemoveCommandDialog,
  SendCommandDialog,
} from "./command-dialogs"

const route = getRouteApi("/_authenticated/server/commands")

type SavedCommand = Command & { id: number }

function isSaved(command: Command): command is SavedCommand {
  return !!command.id
}

function CommandName({ command }: { command: Command }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="inline-flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-medium break-all">
          {command.cmd}
        </span>
        {!isSaved(command) && <Badge variant="outline">Padrão</Badge>}
      </span>
      {command.alias && (
        <span className="text-xs text-muted-foreground">
          Atalho <span className="font-mono">{command.alias}</span>
        </span>
      )}
    </div>
  )
}

export function CommandList() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const commands = useCommands()
  const [sending, setSending] = useState<Command | "free" | null>(null)
  const [editing, setEditing] = useState<SavedCommand | "new" | null>(null)
  const [removing, setRemoving] = useState<SavedCommand | null>(null)
  const hasFilters = !!(search.q || search.target)
  const rows = (commands.data ?? []).filter(
    (command) =>
      matchesQuery(
        `${command.cmd} ${command.alias} ${command.explain}`,
        search.q
      ) &&
      (!search.target || command.target === search.target)
  )

  function filter(patch: Partial<CommandSearch>) {
    void navigate({
      search: (previous) => ({ ...previous, ...patch }),
      replace: true,
      resetScroll: false,
    })
  }

  const actions = (command: Command) => {
    const items: RowAction[] = [
      { label: "Enviar", icon: Send, onSelect: () => setSending(command) },
    ]
    if (isSaved(command))
      items.push(
        {
          label: "Editar comando",
          icon: Pencil,
          onSelect: () => setEditing(command),
        },
        {
          label: "Remover",
          icon: Trash2,
          destructive: true,
          onSelect: () => setRemoving(command),
        }
      )
    return <RowActions name={command.cmd} actions={items} />
  }

  const columns: ColumnDef<Command>[] = [
    {
      id: "cmd",
      header: "Comando",
      cell: ({ row }) => <CommandName command={row.original} />,
    },
    {
      id: "target",
      header: "Servidor",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {targetLabel(row.original.target)}
        </span>
      ),
    },
    {
      id: "option",
      header: "Parâmetros",
      cell: ({ row }) => (
        <span className="font-mono text-xs break-all text-muted-foreground">
          {row.original.option}
        </span>
      ),
    },
    {
      id: "explain",
      header: "Descrição",
      cell: ({ row }) => (
        <span className="break-words text-muted-foreground">
          {row.original.explain}
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
    getRowId: (command) =>
      command.id ? `saved-${command.id}` : `${command.target}-${command.cmd}`,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <ListScreen
      label="Comandos"
      table={table}
      search={{
        value: search.q ?? "",
        placeholder: "Buscar por comando ou descrição",
        onChange: (q) => filter({ q: q || undefined }),
      }}
      filters={
        <FilterSelect
          label="Servidor"
          options={[
            { value: "all", label: "Todos os servidores" },
            ...targetOptions,
          ]}
          value={search.target}
          onChange={(target) =>
            filter({ target: target as CommandSearch["target"] })
          }
        />
      }
      primary={
        <>
          <Button variant="outline" onClick={() => setSending("free")}>
            <Send data-icon="inline-start" />
            Enviar comando
          </Button>
          <Button onClick={() => setEditing("new")}>
            <Plus data-icon="inline-start" />
            Novo comando
          </Button>
        </>
      }
      filtered={hasFilters}
      clearFilters={() => filter({ q: undefined, target: undefined })}
      loading={commands.isPending}
      refreshing={commands.isFetching}
      error={commands.isError ? commands.error : null}
      errorMessage="Não foi possível carregar os comandos. Tente novamente."
      refresh={() => void commands.refetch()}
      emptyMessage="Nenhum comando encontrado"
      mobileRow={(command) => (
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <CommandName command={command} />
            <span className="text-xs text-muted-foreground">
              {targetLabel(command.target)}
              {command.explain && `, ${command.explain}`}
            </span>
          </div>
          {actions(command)}
        </div>
      )}
    >
      {sending && (
        <SendCommandDialog
          command={sending === "free" ? undefined : sending}
          onClose={() => setSending(null)}
        />
      )}
      {editing && (
        <CommandDialog
          command={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {removing && (
        <RemoveCommandDialog
          command={removing}
          onClose={() => setRemoving(null)}
        />
      )}
    </ListScreen>
  )
}
