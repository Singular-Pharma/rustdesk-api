import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAdminMutation } from "@/shared/api/mutation"
import { ConfirmDialog } from "@/shared/components/confirm-dialog"
import { FormDialog } from "@/shared/components/form-dialog"
import { SelectField } from "@/shared/form/fields"
import { useGroupNames } from "@/features/groups/api/groups-api"
import { useUserNames } from "@/features/users/api/users-api"
import {
  permissionLevels,
  ruleTargets,
  rules,
  rulesKey,
  type Collection,
  type Rule,
} from "../api/address-books-api"

const targetKinds = [
  { value: String(ruleTargets.user), label: "Usuário" },
  { value: String(ruleTargets.group), label: "Grupo de usuário" },
]

const groupTarget = String(ruleTargets.group)

const ruleFormSchema = z
  .object({
    type: z.string(),
    userId: z.string(),
    groupId: z.string(),
    rule: z.string(),
  })
  .superRefine((values, context) => {
    const field = values.type === groupTarget ? "groupId" : "userId"
    if (!values[field])
      context.addIssue({
        code: "custom",
        path: [field],
        message: "Selecione com quem compartilhar",
      })
  })

type RuleFormValues = z.infer<typeof ruleFormSchema>

export function RuleDialog({
  collection,
  rule,
  onClose,
}: {
  collection: Collection
  rule?: Rule
  onClose: () => void
}) {
  const users = useUserNames()
  const groups = useGroupNames("user")
  const save = useAdminMutation(
    (values: RuleFormValues) => {
      const body = {
        user_id: collection.user_id,
        collection_id: collection.id,
        type: Number(values.type),
        to_id: Number(
          values.type === groupTarget ? values.groupId : values.userId
        ),
        rule: Number(values.rule),
      }
      return rule ? rules.update({ id: rule.id, ...body }) : rules.create(body)
    },
    [rulesKey]
  )
  const form = useForm<RuleFormValues>({
    mode: "onTouched",
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      type: String(rule?.type ?? ruleTargets.user),
      userId:
        rule && rule.type !== ruleTargets.group ? String(rule.to_id) : "",
      groupId:
        rule?.type === ruleTargets.group ? String(rule.to_id) : "",
      rule: String(rule?.rule ?? 1),
    },
  })
  const type = useWatch({ control: form.control, name: "type" })
  const recipients = users.options.filter(
    (option) => option.value !== String(collection.user_id)
  )
  return (
    <FormDialog
      title={rule ? "Editar regra" : "Nova regra"}
      pending={save.isPending}
      error={save.error}
      errorFallback="Não foi possível salvar a regra. Tente novamente."
      notFound="O usuário ou grupo escolhido não está mais disponível."
      submitLabel={rule ? "Salvar alterações" : "Compartilhar"}
      onSubmit={(event) =>
        void form.handleSubmit((values) =>
          save.mutate(values, { onSuccess: onClose })
        )(event)
      }
      onClose={onClose}
    >
      <SelectField
        control={form.control}
        name="type"
        id="rule-type"
        label="Compartilhar com"
        options={targetKinds}
        disabled={save.isPending}
      />
      {type === groupTarget ? (
        <SelectField
          key="group"
          control={form.control}
          name="groupId"
          id="rule-group"
          label="Grupo"
          options={groups.options}
          disabled={save.isPending}
        />
      ) : (
        <SelectField
          key="user"
          control={form.control}
          name="userId"
          id="rule-user"
          label="Usuário"
          options={recipients}
          disabled={save.isPending}
        />
      )}
      <SelectField
        control={form.control}
        name="rule"
        id="rule-permission"
        label="Permissão"
        options={permissionLevels}
        disabled={save.isPending}
      />
    </FormDialog>
  )
}

export function RemoveRuleDialog({
  rule,
  targetName,
  onClose,
}: {
  rule: Rule
  targetName: string
  onClose: () => void
}) {
  const remove = useAdminMutation(() => rules.remove(rule), [rulesKey])
  return (
    <ConfirmDialog
      title="Remover regra?"
      description={
        <>
          <strong>{targetName}</strong> deixa de ver este catálogo no
          aplicativo.
        </>
      }
      confirmLabel="Remover regra"
      pendingLabel="Removendo…"
      pending={remove.isPending}
      error={remove.error}
      errorFallback="Não foi possível remover a regra. Tente novamente."
      onConfirm={() => remove.mutate(undefined, { onSuccess: onClose })}
      onClose={onClose}
    />
  )
}
