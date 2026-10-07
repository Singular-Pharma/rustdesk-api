import { useState } from "react"
import { getRouteApi } from "@tanstack/react-router"
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { useAdminMutation } from "@/shared/api/mutation"
import { ConfirmDialog } from "@/shared/components/confirm-dialog"
import { FormDialog } from "@/shared/components/form-dialog"
import { ListScreen } from "@/shared/components/list-screen"
import { RowActions } from "@/shared/components/row-actions"
import { SelectField, TextField } from "@/shared/form/fields"
import { FilterSelect } from "@/shared/list/filter-select"
import { matchesQuery } from "@/shared/list/search"
import { useUserNames } from "@/features/users/api/users-api"
import { UserFilterSelect } from "@/features/users/components/user-filter-select"
import {
  hexToTagColor,
  tagColorToHex,
  tags,
  tagsKey,
  useCollectionOptions,
  useTags,
  type Tag,
} from "../api/address-books-api"
import type { TagSearch } from "../schemas"

const route = getRouteApi("/_authenticated/tags")

const defaultTagColor = "#3b82f6"

const tagFormSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da tag"),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  userId: z.string().min(1, "Selecione o dono"),
  collectionId: z.string(),
})

type TagFormValues = z.infer<typeof tagFormSchema>

function TagName({ tag }: { tag: Tag }) {
  return (
    <span className="inline-flex items-center gap-2 font-medium break-words">
      <span
        aria-hidden
        className="size-3 shrink-0 rounded-full border border-black/10"
        style={{ backgroundColor: tagColorToHex(tag.color) }}
      />
      {tag.name}
    </span>
  )
}

function TagDialog({
  tag,
  defaults,
  onClose,
}: {
  tag?: Tag
  defaults: { userId?: number; collectionId?: number }
  onClose: () => void
}) {
  const users = useUserNames()
  const save = useAdminMutation(
    ({ name, color, userId, collectionId }: TagFormValues) => {
      const body = {
        name,
        color: hexToTagColor(color),
        user_id: Number(userId),
        collection_id: Number(collectionId),
      }
      return tag ? tags.update({ id: tag.id, ...body }) : tags.create(body)
    },
    [tagsKey]
  )
  const form = useForm<TagFormValues>({
    mode: "onTouched",
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: tag?.name ?? "",
      color: tag ? tagColorToHex(tag.color) : defaultTagColor,
      userId: String(tag?.user_id ?? defaults.userId ?? ""),
      collectionId: String(tag?.collection_id ?? defaults.collectionId ?? 0),
    },
  })
  const userId = useWatch({ control: form.control, name: "userId" })
  const collections = useCollectionOptions(Number(userId) || undefined)
  return (
    <FormDialog
      title={tag ? "Editar tag" : "Nova tag"}
      pending={save.isPending}
      error={save.error}
      errorFallback="Não foi possível salvar a tag. Tente novamente."
      notFound="Esta tag não está mais disponível."
      submitLabel={tag ? "Salvar alterações" : "Cadastrar tag"}
      onSubmit={(event) =>
        void form.handleSubmit((values) =>
          save.mutate(values, { onSuccess: onClose })
        )(event)
      }
      onClose={onClose}
    >
      <TextField
        id="tag-name"
        label="Nome"
        autoFocus
        readOnly={save.isPending}
        error={form.formState.errors.name}
        note={
          tag
            ? "Endereços que já usam o nome antigo não são atualizados"
            : undefined
        }
        {...form.register("name")}
      />
      <Field orientation="horizontal" className="w-fit">
        <FieldLabel htmlFor="tag-color">Cor</FieldLabel>
        <input
          id="tag-color"
          type="color"
          disabled={save.isPending}
          className="h-9 w-14 cursor-pointer rounded-md border bg-transparent p-1"
          {...form.register("color")}
        />
      </Field>
      {tag ? (
        <p className="text-sm text-muted-foreground">
          Dono: {users.name(tag.user_id) ?? "usuário removido"}
        </p>
      ) : (
        <SelectField
          control={form.control}
          name="userId"
          id="tag-owner"
          label="Dono"
          options={users.options}
          disabled={save.isPending}
        />
      )}
      <SelectField
        control={form.control}
        name="collectionId"
        id="tag-collection"
        label="Catálogo"
        options={collections.options}
        disabled={save.isPending}
      />
    </FormDialog>
  )
}

function RemoveTagDialog({ tag, onClose }: { tag: Tag; onClose: () => void }) {
  const remove = useAdminMutation(() => tags.remove(tag), [tagsKey])
  return (
    <ConfirmDialog
      title="Remover tag?"
      description={
        <>
          <strong>{tag.name}</strong> deixa de aparecer como opção. Os endereços
          marcados com ela mantêm o nome.
        </>
      }
      confirmLabel="Remover tag"
      pendingLabel="Removendo…"
      pending={remove.isPending}
      error={remove.error}
      errorFallback="Não foi possível remover a tag. Tente novamente."
      onConfirm={() => remove.mutate(undefined, { onSuccess: onClose })}
      onClose={onClose}
    />
  )
}

export function TagList() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const query = useTags({
    user_id: search.user,
    collection_id: search.collection,
  })
  const users = useUserNames()
  const collections = useCollectionOptions(search.user)
  const [editing, setEditing] = useState<Tag | "new" | null>(null)
  const [removing, setRemoving] = useState<Tag | null>(null)
  const hasFilters = !!(
    search.q ||
    search.user ||
    search.collection !== undefined
  )
  const rows = (query.data ?? [])
    .filter((tag) => matchesQuery(tag.name, search.q))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))

  function filter(patch: Partial<TagSearch>) {
    void navigate({
      search: (previous) => ({ ...previous, ...patch }),
      replace: true,
      resetScroll: false,
    })
  }

  const actions = (tag: Tag) => (
    <RowActions
      name={tag.name}
      actions={[
        { label: "Editar tag", icon: Pencil, onSelect: () => setEditing(tag) },
        {
          label: "Remover",
          icon: Trash2,
          destructive: true,
          onSelect: () => setRemoving(tag),
        },
      ]}
    />
  )

  const columns: ColumnDef<Tag>[] = [
    {
      id: "name",
      header: "Tag",
      cell: ({ row }) => <TagName tag={row.original} />,
    },
    {
      id: "owner",
      header: "Dono",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {users.name(row.original.user_id) ?? ""}
        </span>
      ),
    },
    {
      id: "collection",
      header: "Catálogo",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {collections.name(row.original.collection_id) ?? ""}
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
    getRowId: (tag) => String(tag.id),
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <ListScreen
      label="Tags"
      table={table}
      search={{
        value: search.q ?? "",
        placeholder: "Buscar por nome",
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
          Nova tag
        </Button>
      }
      filtered={hasFilters}
      clearFilters={() =>
        filter({ q: undefined, user: undefined, collection: undefined })
      }
      loading={query.isPending}
      refreshing={query.isFetching}
      error={query.isError ? query.error : null}
      errorMessage="Não foi possível carregar as tags. Tente novamente."
      refresh={() => void query.refetch()}
      emptyMessage={
        hasFilters ? "Nenhuma tag encontrada" : "Nenhuma tag cadastrada"
      }
      mobileRow={(tag) => (
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <TagName tag={tag} />
            <span className="text-xs text-muted-foreground">
              {[users.name(tag.user_id), collections.name(tag.collection_id)]
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>
          {actions(tag)}
        </div>
      )}
    >
      {editing && (
        <TagDialog
          tag={editing === "new" ? undefined : editing}
          defaults={{ userId: search.user, collectionId: search.collection }}
          onClose={() => setEditing(null)}
        />
      )}
      {removing && (
        <RemoveTagDialog tag={removing} onClose={() => setRemoving(null)} />
      )}
    </ListScreen>
  )
}
