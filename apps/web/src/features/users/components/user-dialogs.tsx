import { useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAdminMutation } from "@/shared/api/mutation"
import { ConfirmDialog } from "@/shared/components/confirm-dialog"
import { FormDialog } from "@/shared/components/form-dialog"
import { TextField } from "@/shared/form/fields"
import {
  removeUser,
  setPassword,
  userLabel,
  usersKey,
  type User,
} from "../api/users-api"
import { passwordSchema } from "../schemas"

const resetSchema = z.object({ password: passwordSchema })

export function ResetPasswordDialog({
  user,
  onClose,
}: {
  user: User
  onClose: () => void
}) {
  const reset = useAdminMutation(
    (password: string) => setPassword(user.id, password),
    []
  )
  const form = useForm({
    mode: "onTouched",
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "" },
  })
  return (
    <FormDialog
      title={`Redefinir senha de ${userLabel(user)}`}
      pending={reset.isPending}
      error={reset.error}
      errorFallback="Não foi possível redefinir a senha. Tente novamente."
      notFound="Este usuário não está mais disponível."
      submitLabel="Redefinir senha"
      onSubmit={(event) =>
        void form.handleSubmit(({ password }) =>
          reset.mutate(password, { onSuccess: onClose })
        )(event)
      }
      onClose={onClose}
    >
      <TextField
        id="new-password"
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        autoFocus
        note="De 4 a 32 caracteres. As sessões abertas desse usuário são encerradas"
        readOnly={reset.isPending}
        error={form.formState.errors.password}
        {...form.register("password")}
      />
    </FormDialog>
  )
}

export function RemoveUserDialog({
  user,
  onClose,
  fromDetail = false,
}: {
  user: User
  onClose: () => void
  fromDetail?: boolean
}) {
  const navigate = useNavigate()
  const remove = useAdminMutation(() => removeUser(user.id), [usersKey])
  return (
    <ConfirmDialog
      title="Remover usuário?"
      description={
        <>
          <strong>{userLabel(user)}</strong> perde o acesso ao aplicativo e a
          este painel. Os catálogos de endereços dele também são removidos.
        </>
      }
      confirmLabel="Remover usuário"
      pendingLabel="Removendo…"
      pending={remove.isPending}
      error={remove.error}
      errorFallback="Não foi possível remover o usuário. Tente novamente."
      onConfirm={() =>
        remove.mutate(undefined, {
          onSuccess: () => {
            onClose()
            if (fromDetail) void navigate({ to: "/users" })
          },
        })
      }
      onClose={onClose}
    />
  )
}
