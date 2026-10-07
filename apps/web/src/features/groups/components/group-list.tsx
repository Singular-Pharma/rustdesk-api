import { useState } from "react"
import { useNavigate, useSearch } from "@tanstack/react-router"
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { ListScreen } from "@/shared/components/list-screen"
import { RowActions } from "@/shared/components/row-actions"
import { FormDialog } from "@/shared/components/form-dialog"
import { ConfirmDialog } from "@/shared/components/confirm-dialog"
import { SelectField, TextField } from "@/shared/form/fields"
import { useAdminMutation } from "@/shared/api/mutation"
import { matchesQuery } from "@/shared/list/search"
import {
  groupResources,
  groupsKey,
  useGroups,
  userGroupTypes,
  type Group,
  type GroupKind,
} from "../api/groups-api"

const copy = {
  user: {
    title: "Grupos de usuário",
    create: "Novo grupo",
    edit: "Editar grupo",
    empty: "Nenhum grupo de usuário cadastrado",
    removeConsequence:
      "Os usuários do grupo continuam cadastrados e precisam ser movidos para outro grupo.",
  },
  device: {
    title: "Grupos de dispositivo",
    create: "Novo grupo",
    edit: "Editar grupo",
    empty: "Nenhum grupo de dispositivo cadastrado",
    removeConsequence: "Os dispositivos do grupo continuam cadastrados.",
  },
}

const groupFormSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do grupo"),
  type: z.string(),
})

type GroupFormValues = z.infer<typeof groupFormSchema>

function GroupDialog({
  kind,
  group,
  onClose,
}: {
  kind: GroupKind
  group?: Group
  onClose: () => void
}) {
  const resource = groupResources[kind]
  const save = useAdminMutation(
    (values: GroupFormValues) => {
      const body = {
        id: group?.id,
        name: values.name,
        ...(kind === "user" && { type: Number(values.type) }),
      }
      return group ? resource.update(body) : resource.create(body)
    },
    [groupsKey(kind)]
  )
  const form = useForm<GroupFormValues>({
    mode: "onTouched",
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: group?.name ?? "",
      type: String(group?.type ?? 1),
    },
  })
  return (
    <FormDialog
      title={group ? copy[kind].edit : copy[kind].create}
      pending={save.isPending}
      error={save.error}
      errorFallback="Não foi possível salvar o grupo. Tente novamente."
      submitLabel={group ? "Salvar alterações" : "Cadastrar grupo"}
      onSubmit={(event) =>
        void form.handleSubmit((values) =>
          save.mutate(values, { onSuccess: onClose })
        )(event)
      }
      onClose={onClose}
    >
      <TextField
        id="group-name"
        label="Nome"
        autoFocus
        readOnly={save.isPending}
        error={form.formState.errors.name}
        {...form.register("name")}
      />
      {kind === "user" && (
        <SelectField
          control={form.control}
          name="type"
          id="group-type"
          label="Tipo"
          options={userGroupTypes}
          disabled={save.isPending}
          note="No tipo compartilhado, quem é do grupo vê os dispositivos dos colegas no aplicativo"
        />
      )}
    </FormDialog>
  )
}

function RemoveGroupDialog({
  kind,
  group,
  onClose,
}: {
  kind: GroupKind
  group: Group
  onClose: () => void
}) {
  const remove = useAdminMutation(
    () => groupResources[kind].remove({ id: group.id }),
    [groupsKey(kind)]
  )
  return (
    <ConfirmDialog
      title="Remover grupo?"
      description={
        <>
          <strong>{group.name}</strong> será removido.{" "}
          {copy[kind].removeConsequence}
        </>
      }
      confirmLabel="Remover grupo"
      pendingLabel="Removendo…"
      pending={remove.isPending}
      error={remove.error}
      errorFallback="Não foi possível remover o grupo. Tente novamente."
      onConfirm={() => remove.mutate(undefined, { onSuccess: onClose })}
      onClose={onClose}
    />
  )
}

export function GroupList({ kind }: { kind: GroupKind }) {
  const search = useSearch({ strict: false }) as { q?: string }
  const navigate = useNavigate()
  const groups = useGroups(kind)
  const [editing, setEditing] = useState<Group | "new" | null>(null)
  const [removing, setRemoving] = useState<Group | null>(null)
  const rows = (groups.data ?? []).filter((group) =>
    matchesQuery(group.name, search.q)
  )
  const typeLabel = (type?: number) =>
    userGroupTypes.find((option) => option.value === String(type))?.label ?? ""

  const actions = (group: Group) => (
    <RowActions
      name={group.name}
      actions={[
        {
          label: copy[kind].edit,
          icon: Pencil,
          onSelect: () => setEditing(group),
        },
        {
          label: "Remover",
          icon: Trash2,
          destructive: true,
          onSelect: () => setRemoving(group),
        },
      ]}
    />
  )

  const columns: ColumnDef<Group>[] = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => (
        <button
          type="button"
          className="text-left font-medium underline-offset-4 hover:underline"
          onClick={() => setEditing(row.original)}
        >
          {row.original.name}
        </button>
      ),
    },
    ...(kind === "user"
      ? [
          {
            id: "type",
            header: "Tipo",
            cell: ({ row }) => (
              <span className="text-muted-foreground">
                {typeLabel(row.original.type)}
              </span>
            ),
          } satisfies ColumnDef<Group>,
        ]
      : []),
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => actions(row.original),
    },
  ]
  const table = useReactTable({
    data: rows,
    columns,
    getRowId: (group) => String(group.id),
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <ListScreen
      label={copy[kind].title}
      table={table}
      search={{
        value: search.q ?? "",
        placeholder: "Buscar por nome",
        onChange: (q) =>
          void navigate({
            to: ".",
            search: { q: q || undefined },
            replace: true,
            resetScroll: false,
          }),
      }}
      primary={
        <Button onClick={() => setEditing("new")}>
          <Plus data-icon="inline-start" />
          {copy[kind].create}
        </Button>
      }
      filtered={!!search.q}
      clearFilters={() => void navigate({ to: ".", search: {}, replace: true })}
      loading={groups.isPending}
      refreshing={groups.isFetching}
      error={groups.isError ? groups.error : null}
      errorMessage="Não foi possível carregar os grupos. Tente novamente."
      refresh={() => void groups.refetch()}
      emptyMessage={search.q ? "Nenhum grupo encontrado" : copy[kind].empty}
      mobileRow={(group) => (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium break-words">{group.name}</p>
            {kind === "user" && (
              <p className="text-xs text-muted-foreground">
                {typeLabel(group.type)}
              </p>
            )}
          </div>
          {actions(group)}
        </div>
      )}
    >
      {editing && (
        <GroupDialog
          kind={kind}
          group={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {removing && (
        <RemoveGroupDialog
          kind={kind}
          group={removing}
          onClose={() => setRemoving(null)}
        />
      )}
    </ListScreen>
  )
}
