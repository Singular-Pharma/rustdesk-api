import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { useAdminMutation } from "@/shared/api/mutation"
import { ConfirmDialog } from "@/shared/components/confirm-dialog"
import { FormDialog } from "@/shared/components/form-dialog"
import { PendingButton } from "@/shared/components/pending-button"
import { RequestError } from "@/shared/components/request-error"
import { SelectField, TextField } from "@/shared/form/fields"
import { useAuthStore } from "@/stores/auth-store"
import {
  commandsKey,
  removeCommand,
  saveCommand,
  sendCommand,
  serverStateKey,
  serverTargets,
  targetLabel,
  targetOptions,
  type Command,
} from "../api/server-api"

const sendFormSchema = z.object({
  target: z.string(),
  cmd: z.string().trim().min(1, "Informe o comando"),
  option: z.string().trim(),
})

type SendFormValues = z.infer<typeof sendFormSchema>

export function SendCommandDialog({
  command,
  onClose,
}: {
  command?: Command
  onClose: () => void
}) {
  const session = useAuthStore((state) => state.session)
  const [reply, setReply] = useState<string | null>(null)
  const send = useAdminMutation(
    ({ target, cmd, option }: SendFormValues) =>
      sendCommand(target, cmd, option),
    [serverStateKey]
  )
  const form = useForm<SendFormValues>({
    mode: "onTouched",
    resolver: zodResolver(sendFormSchema),
    defaultValues: {
      target: command?.target ?? serverTargets.id,
      cmd: command?.cmd ?? "",
      option: "",
    },
  })
  const errors = form.formState.errors
  return (
    <Dialog
      open={!!session}
      onOpenChange={(open) => {
        if (!open && !send.isPending) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100svh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] p-0 sm:max-w-2xl"
      >
        <form
          noValidate
          aria-busy={send.isPending}
          className="contents"
          onSubmit={(event) =>
            void form.handleSubmit((values) => {
              setReply(null)
              send.mutate(values, { onSuccess: setReply })
            })(event)
          }
        >
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>
              {command
                ? `Enviar ${command.cmd} ao ${targetLabel(command.target).toLocaleLowerCase("pt-BR")}`
                : "Enviar comando"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid content-start gap-4 overflow-y-auto px-6 py-1">
            {!command && (
              <SelectField
                control={form.control}
                name="target"
                id="send-target"
                label="Servidor"
                options={targetOptions}
                disabled={send.isPending}
              />
            )}
            <div className="grid gap-x-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
              <TextField
                id="send-cmd"
                label="Comando"
                autoComplete="off"
                autoCapitalize="none"
                className="font-mono"
                readOnly={send.isPending || !!command}
                error={errors.cmd}
                {...form.register("cmd")}
              />
              <TextField
                id="send-option"
                label="Parâmetros"
                autoComplete="off"
                autoCapitalize="none"
                autoFocus={!!command}
                className="font-mono"
                placeholder={command?.option || undefined}
                readOnly={send.isPending}
                {...form.register("option")}
              />
            </div>
            {send.isError && (
              <RequestError
                error={send.error}
                fallback="O servidor não respondeu ao comando. Confira se ele está no ar e tente novamente."
              />
            )}
            {reply !== null && (
              <section aria-label="Resposta do servidor" className="grid gap-2">
                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Resposta
                </h3>
                <pre
                  role="status"
                  className="max-h-72 overflow-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap"
                >
                  {reply.trim() || "Sem resposta"}
                </pre>
              </section>
            )}
          </div>
          <DialogFooter className="px-6 pb-6">
            <DialogClose
              render={<Button type="button" variant="outline" />}
              disabled={send.isPending}
            >
              Fechar
            </DialogClose>
            <PendingButton
              type="submit"
              pending={send.isPending}
              label="Enviar"
              pendingLabel="Enviando…"
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const commandFormSchema = z.object({
  cmd: z.string().trim().min(1, "Informe o comando"),
  alias: z.string().trim(),
  option: z.string().trim(),
  target: z.string(),
  explain: z.string().trim(),
})

type CommandFormValues = z.infer<typeof commandFormSchema>

export function CommandDialog({
  command,
  onClose,
}: {
  command?: Command
  onClose: () => void
}) {
  const save = useAdminMutation(
    (values: CommandFormValues) => saveCommand(values, command?.id),
    [commandsKey]
  )
  const form = useForm<CommandFormValues>({
    mode: "onTouched",
    resolver: zodResolver(commandFormSchema),
    defaultValues: {
      cmd: command?.cmd ?? "",
      alias: command?.alias ?? "",
      option: command?.option ?? "",
      target: command?.target ?? serverTargets.id,
      explain: command?.explain ?? "",
    },
  })
  const errors = form.formState.errors
  return (
    <FormDialog
      title={command ? "Editar comando" : "Novo comando"}
      pending={save.isPending}
      error={save.error}
      errorFallback="Não foi possível salvar o comando. Tente novamente."
      notFound="Este comando não está mais disponível."
      submitLabel={command ? "Salvar alterações" : "Cadastrar comando"}
      onSubmit={(event) =>
        void form.handleSubmit((values) =>
          save.mutate(values, { onSuccess: onClose })
        )(event)
      }
      onClose={onClose}
    >
      <SelectField
        control={form.control}
        name="target"
        id="command-target"
        label="Servidor"
        options={targetOptions}
        disabled={save.isPending}
      />
      <div className="grid gap-x-4 sm:grid-cols-2">
        <TextField
          id="command-cmd"
          label="Comando"
          autoComplete="off"
          autoCapitalize="none"
          autoFocus
          className="font-mono"
          readOnly={save.isPending}
          error={errors.cmd}
          {...form.register("cmd")}
        />
        <TextField
          id="command-alias"
          label="Atalho"
          autoComplete="off"
          autoCapitalize="none"
          className="font-mono"
          readOnly={save.isPending}
          {...form.register("alias")}
        />
      </div>
      <TextField
        id="command-option"
        label="Parâmetros de exemplo"
        autoComplete="off"
        className="font-mono"
        readOnly={save.isPending}
        {...form.register("option")}
      />
      <TextField
        id="command-explain"
        label="Descrição"
        readOnly={save.isPending}
        {...form.register("explain")}
      />
    </FormDialog>
  )
}

export function RemoveCommandDialog({
  command,
  onClose,
}: {
  command: Command & { id: number }
  onClose: () => void
}) {
  const remove = useAdminMutation(
    () => removeCommand(command.id),
    [commandsKey]
  )
  return (
    <ConfirmDialog
      title="Remover comando?"
      description={
        <>
          <strong className="font-mono">{command.cmd}</strong> sai da lista de
          comandos salvos. Nada muda no servidor.
        </>
      }
      confirmLabel="Remover comando"
      pendingLabel="Removendo…"
      pending={remove.isPending}
      error={remove.error}
      errorFallback="Não foi possível remover o comando. Tente novamente."
      onConfirm={() => remove.mutate(undefined, { onSuccess: onClose })}
      onClose={onClose}
    />
  )
}
