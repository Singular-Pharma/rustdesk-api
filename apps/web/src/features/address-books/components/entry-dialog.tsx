import { Controller, useForm, useWatch, type Control } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@workspace/ui/components/field"
import { useAdminMutation } from "@/shared/api/mutation"
import { FormDialog } from "@/shared/components/form-dialog"
import { SelectField, SwitchField, TextField } from "@/shared/form/fields"
import { useUserNames } from "@/features/users/api/users-api"
import {
  entriesKey,
  platforms,
  saveEntry,
  tagColorToHex,
  useCollectionOptions,
  useTags,
  type Entry,
} from "../api/address-books-api"

const entryFormSchema = z.object({
  userId: z.string().min(1, "Selecione o dono"),
  collectionId: z.string(),
  id: z.string().trim().min(1, "Informe o ID do dispositivo"),
  alias: z.string().trim(),
  hostname: z.string().trim(),
  username: z.string().trim(),
  platform: z.string(),
  tags: z.array(z.string()),
  forceAlwaysRelay: z.boolean(),
  rdpPort: z.string().trim(),
  rdpUsername: z.string().trim(),
  password: z.string(),
})

type EntryFormValues = z.infer<typeof entryFormSchema>

function TagChoices({
  control,
  userId,
  collectionId,
  disabled,
}: {
  control: Control<EntryFormValues>
  userId: number
  collectionId: number
  disabled: boolean
}) {
  const available = useTags({ user_id: userId, collection_id: collectionId })
  if (!userId || !available.data?.length) return null
  return (
    <Controller
      control={control}
      name="tags"
      render={({ field }) => (
        <FieldSet>
          <FieldLegend variant="label">Tags</FieldLegend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {available.data.map((tag) => {
              const id = `entry-tag-${tag.id}`
              const checked = field.value.includes(tag.name)
              return (
                <Field key={tag.id} orientation="horizontal" className="w-fit">
                  <Checkbox
                    id={id}
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={(next) =>
                      field.onChange(
                        next
                          ? [...field.value, tag.name]
                          : field.value.filter((name) => name !== tag.name)
                      )
                    }
                  />
                  <FieldLabel htmlFor={id} className="font-normal">
                    <span
                      aria-hidden
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: tagColorToHex(tag.color) }}
                    />
                    {tag.name}
                  </FieldLabel>
                </Field>
              )
            })}
          </div>
        </FieldSet>
      )}
    />
  )
}

export function EntryDialog({
  entry,
  defaults,
  onClose,
}: {
  entry?: Entry
  defaults: { userId?: number; collectionId?: number }
  onClose: () => void
}) {
  const users = useUserNames()
  const save = useAdminMutation(
    ({ userId, collectionId, password, ...values }: EntryFormValues) =>
      saveEntry(
        {
          ...values,
          user_id: Number(userId),
          collection_id: Number(collectionId),
          ...(password && { password }),
        },
        entry?.row_id
      ),
    [entriesKey]
  )
  const form = useForm<EntryFormValues>({
    mode: "onTouched",
    resolver: zodResolver(entryFormSchema),
    defaultValues: {
      userId: String(entry?.user_id ?? defaults.userId ?? ""),
      collectionId: String(entry?.collection_id ?? defaults.collectionId ?? 0),
      id: entry?.id ?? "",
      alias: entry?.alias ?? "",
      hostname: entry?.hostname ?? "",
      username: entry?.username ?? "",
      platform: entry?.platform ?? "",
      tags: entry?.tags ?? [],
      forceAlwaysRelay: entry?.forceAlwaysRelay ?? false,
      rdpPort: entry?.rdpPort ?? "",
      rdpUsername: entry?.rdpUsername ?? "",
      password: "",
    },
  })
  const [userId, collectionId] = useWatch({
    control: form.control,
    name: ["userId", "collectionId"],
  })
  const collections = useCollectionOptions(Number(userId) || undefined)
  const errors = form.formState.errors
  const pending = save.isPending
  return (
    <FormDialog
      title={entry ? "Editar endereço" : "Novo endereço"}
      wide
      pending={pending}
      error={save.error}
      errorFallback="Não foi possível salvar o endereço. Tente novamente."
      notFound="Este endereço não está mais disponível."
      submitLabel={entry ? "Salvar alterações" : "Cadastrar endereço"}
      onSubmit={(event) =>
        void form.handleSubmit((values) =>
          save.mutate(values, { onSuccess: onClose })
        )(event)
      }
      onClose={onClose}
    >
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {entry ? (
          <p className="text-sm text-muted-foreground sm:col-span-2">
            Dono: {users.name(entry.user_id) ?? "usuário removido"}
          </p>
        ) : (
          <SelectField
            control={form.control}
            name="userId"
            id="entry-owner"
            label="Dono"
            options={users.options}
            disabled={pending}
          />
        )}
        <SelectField
          control={form.control}
          name="collectionId"
          id="entry-collection"
          label="Catálogo"
          options={collections.options}
          disabled={pending}
        />
        <TextField
          id="entry-id"
          label="ID"
          inputMode="numeric"
          autoComplete="off"
          className="font-mono"
          readOnly={pending}
          error={errors.id}
          {...form.register("id")}
        />
        <TextField
          id="entry-alias"
          label="Apelido"
          readOnly={pending}
          error={errors.alias}
          {...form.register("alias")}
        />
        <TextField
          id="entry-hostname"
          label="Nome do computador"
          autoComplete="off"
          readOnly={pending}
          error={errors.hostname}
          {...form.register("hostname")}
        />
        <TextField
          id="entry-username"
          label="Usuário do sistema"
          autoComplete="off"
          readOnly={pending}
          error={errors.username}
          {...form.register("username")}
        />
        <SelectField
          control={form.control}
          name="platform"
          id="entry-platform"
          label="Sistema operacional"
          options={platforms}
          disabled={pending}
        />
        <TextField
          id="entry-password"
          label="Senha do dispositivo"
          type="password"
          autoComplete="new-password"
          readOnly={pending}
          note={entry ? "Em branco, a senha salva continua a mesma" : undefined}
          {...form.register("password")}
        />
        <TextField
          id="entry-rdp-port"
          label="Porta RDP"
          inputMode="numeric"
          autoComplete="off"
          readOnly={pending}
          {...form.register("rdpPort")}
        />
        <TextField
          id="entry-rdp-username"
          label="Usuário RDP"
          autoComplete="off"
          readOnly={pending}
          {...form.register("rdpUsername")}
        />
        <div className="sm:col-span-2">
          <TagChoices
            control={form.control}
            userId={Number(userId)}
            collectionId={Number(collectionId)}
            disabled={pending}
          />
        </div>
        <div className="pt-2 sm:col-span-2">
          <SwitchField
            control={form.control}
            name="forceAlwaysRelay"
            id="entry-relay"
            label="Sempre conectar pelo relay"
            disabled={pending}
          />
        </div>
      </div>
    </FormDialog>
  )
}
