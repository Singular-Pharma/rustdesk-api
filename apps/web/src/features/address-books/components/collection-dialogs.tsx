import { useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAdminMutation } from "@/shared/api/mutation"
import { ConfirmDialog } from "@/shared/components/confirm-dialog"
import { FormDialog } from "@/shared/components/form-dialog"
import { SelectField, TextField } from "@/shared/form/fields"
import { useUserNames } from "@/features/users/api/users-api"
import {
  collections,
  collectionsKey,
  entriesKey,
  rulesKey,
  tagsKey,
  type Collection,
} from "../api/address-books-api"

const collectionFormSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do catálogo"),
  userId: z.string().min(1, "Selecione o dono"),
})

type CollectionFormValues = z.infer<typeof collectionFormSchema>

export function CollectionDialog({
  collection,
  onClose,
}: {
  collection?: Collection
  onClose: () => void
}) {
  const users = useUserNames()
  const save = useAdminMutation(
    ({ name, userId }: CollectionFormValues) => {
      const body = { name, user_id: Number(userId) }
      return collection
        ? collections.update({ id: collection.id, ...body })
        : collections.create(body)
    },
    [collectionsKey]
  )
  const form = useForm<CollectionFormValues>({
    mode: "onTouched",
    resolver: zodResolver(collectionFormSchema),
    defaultValues: {
      name: collection?.name ?? "",
      userId: collection ? String(collection.user_id) : "",
    },
  })
  return (
    <FormDialog
      title={collection ? "Editar catálogo" : "Novo catálogo"}
      pending={save.isPending}
      error={save.error}
      errorFallback="Não foi possível salvar o catálogo. Tente novamente."
      notFound="Este catálogo não está mais disponível."
      submitLabel={collection ? "Salvar alterações" : "Cadastrar catálogo"}
      onSubmit={(event) =>
        void form.handleSubmit((values) =>
          save.mutate(values, { onSuccess: onClose })
        )(event)
      }
      onClose={onClose}
    >
      <TextField
        id="collection-name"
        label="Nome"
        autoFocus
        readOnly={save.isPending}
        error={form.formState.errors.name}
        {...form.register("name")}
      />
      {collection ? (
        <p className="text-sm text-muted-foreground">
          Dono: {users.name(collection.user_id) ?? "usuário removido"}
        </p>
      ) : (
        <SelectField
          control={form.control}
          name="userId"
          id="collection-owner"
          label="Dono"
          options={users.options}
          disabled={save.isPending}
          note="O dono vê e altera o catálogo no aplicativo"
        />
      )}
    </FormDialog>
  )
}

export function RemoveCollectionDialog({
  collection,
  onClose,
  fromDetail = false,
}: {
  collection: Collection
  onClose: () => void
  fromDetail?: boolean
}) {
  const navigate = useNavigate()
  const remove = useAdminMutation(
    () =>
      collections.remove({
        id: collection.id,
        user_id: collection.user_id,
        name: collection.name,
      }),
    [collectionsKey, rulesKey, entriesKey, tagsKey]
  )
  return (
    <ConfirmDialog
      title="Remover catálogo?"
      description={
        <>
          <strong>{collection.name}</strong> é removido junto com todos os
          endereços e regras de compartilhamento dele. Quem recebeu o catálogo
          perde o acesso.
        </>
      }
      confirmLabel="Remover catálogo"
      pendingLabel="Removendo…"
      pending={remove.isPending}
      error={remove.error}
      errorFallback="Não foi possível remover o catálogo. Tente novamente."
      onConfirm={() =>
        remove.mutate(undefined, {
          onSuccess: () => {
            onClose()
            if (fromDetail) void navigate({ to: "/address-books" })
          },
        })
      }
      onClose={onClose}
    />
  )
}
