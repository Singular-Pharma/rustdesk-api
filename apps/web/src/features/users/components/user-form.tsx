import { useRef, useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { useAuthStore } from "@/stores/auth-store"
import { useAdminMutation } from "@/shared/api/mutation"
import { RequestError } from "@/shared/components/request-error"
import { LoadingLine } from "@/shared/components/loading-line"
import { FormSection } from "@/shared/form/form-section"
import { SaveBar } from "@/shared/form/save-bar"
import { useUnsavedGuard } from "@/shared/form/unsaved-guard"
import {
  SelectField,
  SwitchField,
  TextField,
  TextareaField,
} from "@/shared/form/fields"
import { useGroupNames } from "@/features/groups/api/groups-api"
import {
  createUser,
  disabledStatus,
  enabledStatus,
  PasswordNotSetError,
  updateUser,
  useUser,
  usersKey,
  type User,
  type UserInput,
} from "../api/users-api"
import {
  createUserSchema,
  userFormSchema,
  type UserFormInput,
  type UserFormValues,
} from "../schemas"

function toInput(values: UserFormValues): UserInput {
  return {
    username: values.username,
    email: values.email,
    nickname: values.nickname,
    group_id: Number(values.groupId),
    is_admin: values.isAdmin,
    status: values.enabled ? enabledStatus : disabledStatus,
    remark: values.remark,
  }
}

export function UserForm({ user }: { user?: User }) {
  const navigate = useNavigate()
  const groups = useGroupNames("user")
  const saved = useRef(false)
  const [createdWithoutPassword, setCreatedWithoutPassword] =
    useState<PasswordNotSetError | null>(null)
  const save = useAdminMutation(
    async (values: UserFormValues) => {
      if (!user) return createUser(toInput(values), values.password)
      await updateUser(user.id, toInput(values))
      return user.id
    },
    [usersKey]
  )
  const form = useForm<UserFormInput, unknown, UserFormValues>({
    mode: "onTouched",
    resolver: zodResolver(user ? userFormSchema : createUserSchema),
    defaultValues: {
      username: user?.username ?? "",
      email: user?.email ?? "",
      nickname: user?.nickname ?? "",
      groupId: user?.group_id ? String(user.group_id) : "",
      isAdmin: !!user?.is_admin,
      enabled: user ? user.status === enabledStatus : true,
      remark: user?.remark ?? "",
      password: "",
    },
  })
  useUnsavedGuard(form.formState.isDirty, saved)

  async function submit(values: UserFormValues) {
    const token = useAuthStore.getState().session?.token
    try {
      const id = await save.mutateAsync(values)
      if (useAuthStore.getState().session?.token !== token) return
      saved.current = true
      await navigate({ to: "/users/$userId", params: { userId: String(id) } })
    } catch (failure) {
      if (failure instanceof PasswordNotSetError) {
        saved.current = true
        setCreatedWithoutPassword(failure)
      }
    }
  }

  const errors = form.formState.errors
  const pending = save.isPending
  return (
    <div className="flex flex-col gap-8">
      <Button
        variant="ghost"
        className="-ml-3 w-fit"
        render={<Link to="/users" />}
        nativeButton={false}
        role="link"
      >
        <ArrowLeft data-icon="inline-start" />
        Voltar para usuários
      </Button>
      <form
        onSubmit={(event) => void form.handleSubmit(submit)(event)}
        noValidate
        aria-busy={pending}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col divide-y">
          <FormSection title="Identificação">
            <TextField
              id="username"
              label="Usuário"
              autoComplete="off"
              autoCapitalize="none"
              readOnly={pending}
              error={errors.username}
              note="Usado para entrar no aplicativo e neste painel"
              {...form.register("username")}
            />
            <TextField
              id="nickname"
              label="Nome de exibição"
              readOnly={pending}
              error={errors.nickname}
              {...form.register("nickname")}
            />
            <TextField
              id="email"
              label="E-mail"
              type="email"
              autoComplete="off"
              readOnly={pending}
              error={errors.email}
              {...form.register("email")}
            />
            <SelectField
              control={form.control}
              name="groupId"
              id="group"
              label="Grupo"
              options={groups.options}
              disabled={pending}
            />
          </FormSection>
          <FormSection title="Acesso">
            {!user && (
              <TextField
                id="password"
                label="Senha inicial"
                type="password"
                autoComplete="new-password"
                readOnly={pending}
                error={errors.password}
                note="De 4 a 32 caracteres"
                {...form.register("password")}
              />
            )}
            <div className="flex flex-col gap-4 md:col-span-2">
              <SwitchField
                control={form.control}
                name="enabled"
                id="enabled"
                label="Usuário ativo"
                note="Desativado, o usuário não entra no aplicativo nem neste painel"
                disabled={pending}
              />
              <SwitchField
                control={form.control}
                name="isAdmin"
                id="is-admin"
                label="Administrador"
                note="Administradores veem e alteram todos os dispositivos, usuários e configurações"
                disabled={pending}
              />
            </div>
          </FormSection>
          <FormSection title="Observações">
            <div className="md:col-span-2">
              <TextareaField
                id="remark"
                label="Observação"
                rows={3}
                readOnly={pending}
                error={errors.remark}
                {...form.register("remark")}
              />
            </div>
          </FormSection>
        </div>
        {createdWithoutPassword ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              <p>
                O usuário foi cadastrado, mas a senha não foi definida. Abra o
                cadastro e use “Redefinir senha”.
              </p>
              {createdWithoutPassword.userId && (
                <Button
                  variant="outline"
                  className="mt-3 w-fit"
                  render={
                    <Link
                      to="/users/$userId"
                      params={{
                        userId: String(createdWithoutPassword.userId),
                      }}
                    />
                  }
                  nativeButton={false}
                  role="link"
                >
                  Abrir usuário
                </Button>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          save.isError && (
            <RequestError
              error={save.error}
              fallback="Não foi possível salvar o usuário. Tente novamente."
              notFound="Este usuário não está mais disponível."
            />
          )
        )}
        <SaveBar
          pending={pending}
          label={user ? "Salvar alterações" : "Cadastrar usuário"}
          cancel={
            user ? (
              <Link to="/users/$userId" params={{ userId: String(user.id) }} />
            ) : (
              <Link to="/users" />
            )
          }
        />
      </form>
    </div>
  )
}

export function EditUser({ id }: { id: number }) {
  const user = useUser(id)
  if (user.isPending) return <LoadingLine label="Carregando usuário…" />
  if (user.isError)
    return (
      <RequestError
        error={user.error}
        fallback="Não foi possível carregar o usuário."
        notFound="Este usuário não está mais disponível."
        retry={() => void user.refetch()}
      />
    )
  return <UserForm key={user.data.id} user={user.data} />
}
