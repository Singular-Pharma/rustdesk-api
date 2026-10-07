import { useId, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { RefreshCw, X } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Switch } from "@workspace/ui/components/switch"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Spinner } from "@workspace/ui/components/spinner"
import { useAdminMutation } from "@/shared/api/mutation"
import { DetailSection } from "@/shared/components/detail-page"
import { LoadingLine } from "@/shared/components/loading-line"
import { PendingButton } from "@/shared/components/pending-button"
import { RequestError } from "@/shared/components/request-error"
import {
  replyLines,
  sendCommand,
  serverStateKey,
  serverTargets,
  useServerAvailability,
  useServerReply,
} from "../api/server-api"

const enabledReply = /:\s*true/i

function Availability({
  label,
  availability,
}: {
  label: string
  availability: ReturnType<typeof useServerAvailability>
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm">{label}</span>
      {availability.isPending ? (
        <Spinner
          aria-label={`Verificando ${label.toLocaleLowerCase("pt-BR")}`}
        />
      ) : availability.available ? (
        <Badge variant="secondary">Respondendo</Badge>
      ) : (
        <Badge variant="outline">Sem resposta</Badge>
      )}
    </div>
  )
}

function RelayServersForm({ current }: { current: string }) {
  const [draft, setDraft] = useState(current)
  const save = useAdminMutation(
    (servers: string) => sendCommand(serverTargets.id, "rs", servers),
    [serverStateKey]
  )
  const id = useId()
  const unchanged = draft.trim() === current
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        save.mutate(draft.replace(/\s+/g, ""))
      }}
    >
      <Field>
        <FieldLabel htmlFor={id}>Servidores de relay</FieldLabel>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id={id}
            className="font-mono sm:max-w-md"
            autoComplete="off"
            placeholder="relay.exemplo.com.br:21117"
            value={draft}
            readOnly={save.isPending}
            onChange={(event) => setDraft(event.target.value)}
          />
          <PendingButton
            type="submit"
            variant="outline"
            pending={save.isPending}
            disabled={unchanged}
            label="Aplicar"
            pendingLabel="Aplicando…"
          />
        </div>
        <FieldDescription>Separe vários endereços por vírgula</FieldDescription>
      </Field>
      {save.isError && (
        <RequestError
          error={save.error}
          fallback="Não foi possível alterar os servidores de relay. Tente novamente."
        />
      )}
    </form>
  )
}

function ToggleSetting({
  command,
  label,
  note,
  reapplyRelayServers,
}: {
  command: string
  label: string
  note: string
  reapplyRelayServers?: string
}) {
  const current = useServerReply(serverTargets.id, command)
  const id = useId()
  const save = useAdminMutation(
    async (enabled: boolean) => {
      await sendCommand(serverTargets.id, command, enabled ? "Y" : "N")
      if (reapplyRelayServers)
        await sendCommand(serverTargets.id, "rs", reapplyRelayServers)
    },
    [serverStateKey]
  )
  const enabled = enabledReply.test(current.data ?? "")
  return (
    <div className="flex flex-col gap-3">
      <Field orientation="horizontal" data-disabled={!current.isSuccess}>
        <FieldContent>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <FieldDescription id={`${id}-note`}>{note}</FieldDescription>
        </FieldContent>
        {save.isPending || current.isFetching ? (
          <Spinner
            aria-label={`Atualizando ${label.toLocaleLowerCase("pt-BR")}`}
          />
        ) : (
          <Switch
            id={id}
            aria-describedby={`${id}-note`}
            checked={enabled}
            disabled={!current.isSuccess}
            onCheckedChange={(next) => save.mutate(next)}
          />
        )}
      </Field>
      {(save.isError || current.isError) && (
        <RequestError
          error={save.error ?? current.error}
          fallback={`Não foi possível ${save.isError ? "alterar" : "ler"} esta configuração. Tente novamente.`}
        />
      )}
    </div>
  )
}

function IpListSetting({
  command,
  label,
  note,
}: {
  command: "blocklist" | "blacklist"
  label: string
  note: string
}) {
  const current = useServerReply(serverTargets.relay, command)
  const [draft, setDraft] = useState("")
  const id = useId()
  const change = useAdminMutation(
    ({ action, ips }: { action: "add" | "remove"; ips: string }) =>
      sendCommand(serverTargets.relay, `${command}-${action}`, ips),
    [serverStateKey]
  )
  const ips = replyLines(current.data ?? "")
  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          const typed = draft
            .split(/[\s,|]+/)
            .filter(Boolean)
            .join("|")
          if (!typed) return
          change.mutate(
            { action: "add", ips: typed },
            { onSuccess: () => setDraft("") }
          )
        }}
      >
        <Field>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <FieldDescription>{note}</FieldDescription>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id={id}
              className="font-mono sm:max-w-md"
              autoComplete="off"
              inputMode="decimal"
              placeholder="203.0.113.10"
              value={draft}
              readOnly={change.isPending}
              onChange={(event) => setDraft(event.target.value)}
            />
            <PendingButton
              type="submit"
              variant="outline"
              pending={change.isPending}
              disabled={!draft.trim()}
              label="Adicionar"
              pendingLabel="Aplicando…"
            />
          </div>
        </Field>
      </form>
      {current.isPending ? (
        <LoadingLine label="Carregando lista…" className="py-2" />
      ) : current.isError ? (
        <RequestError
          error={current.error}
          fallback="Não foi possível ler a lista. Tente novamente."
          retry={() => void current.refetch()}
        />
      ) : ips.length ? (
        <ul className="flex flex-wrap gap-2" aria-label={label}>
          {ips.map((ip) => (
            <li
              key={ip}
              className="inline-flex items-center gap-1 rounded-md border py-0.5 pr-0.5 pl-2 font-mono text-xs"
            >
              {ip}
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Remover ${ip}`}
                disabled={change.isPending}
                onClick={() => change.mutate({ action: "remove", ips: ip })}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum IP na lista</p>
      )}
      {change.isError && (
        <RequestError
          error={change.error}
          fallback="Não foi possível alterar a lista. Tente novamente."
        />
      )}
    </div>
  )
}

function IdServerSettings() {
  const help = useServerAvailability(serverTargets.id)
  const relayServers = useServerReply(serverTargets.id, "rs", help.available)
  if (help.isPending) return <LoadingLine label="Consultando o servidor…" />
  if (!help.available)
    return (
      <p className="text-sm text-muted-foreground">
        O servidor de ID não respondeu. As configurações dele ficam
        indisponíveis até ele voltar.
      </p>
    )
  const currentRelayServers = replyLines(relayServers.data ?? "").join(",")
  return (
    <div className="flex flex-col gap-8">
      {relayServers.isPending ? (
        <LoadingLine label="Carregando servidores de relay…" className="py-2" />
      ) : relayServers.isError ? (
        <RequestError
          error={relayServers.error}
          fallback="Não foi possível ler os servidores de relay. Tente novamente."
          retry={() => void relayServers.refetch()}
        />
      ) : (
        <RelayServersForm
          key={currentRelayServers}
          current={currentRelayServers}
        />
      )}
      <ToggleSetting
        command="aur"
        label="Sempre usar relay"
        note="As conexões deixam de tentar a ligação direta entre os computadores"
        reapplyRelayServers={currentRelayServers}
      />
      {help.supports("must-login") && (
        <ToggleSetting
          command="ml"
          label="Exigir login"
          note="Só quem entrou com uma conta no aplicativo consegue iniciar conexões"
        />
      )}
    </div>
  )
}

function RelaySettings() {
  const help = useServerAvailability(serverTargets.relay)
  if (help.isPending) return <LoadingLine label="Consultando o servidor…" />
  if (!help.available)
    return (
      <p className="text-sm text-muted-foreground">
        O servidor de relay não respondeu. As configurações dele ficam
        indisponíveis até ele voltar.
      </p>
    )
  return (
    <div className="flex flex-col gap-8">
      <IpListSetting
        command="blocklist"
        label="IPs bloqueados"
        note="Conexões vindas desses IPs são recusadas pelo relay"
      />
      <IpListSetting
        command="blacklist"
        label="IPs com velocidade limitada"
        note="Conexões vindas desses IPs passam pelo relay com banda reduzida"
      />
    </div>
  )
}

export function ServerSettings() {
  const client = useQueryClient()
  const idServer = useServerAvailability(serverTargets.id)
  const relayServer = useServerAvailability(serverTargets.relay)
  const checking = idServer.isFetching || relayServer.isFetching
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-prose text-sm text-muted-foreground">
          As alterações valem na hora para todos os clientes e se perdem quando
          o servidor reinicia.
        </p>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Consultar o servidor de novo"
          disabled={checking}
          onClick={() =>
            void client.invalidateQueries({ queryKey: serverStateKey })
          }
        >
          {checking ? <Spinner /> : <RefreshCw />}
        </Button>
      </div>
      <DetailSection title="Situação">
        <div className="flex max-w-md flex-col divide-y border-y">
          <Availability label="Servidor de ID" availability={idServer} />
          <Availability label="Servidor de relay" availability={relayServer} />
        </div>
      </DetailSection>
      <DetailSection title="Servidor de ID">
        <IdServerSettings />
      </DetailSection>
      <DetailSection title="Servidor de relay">
        <RelaySettings />
      </DetailSection>
    </div>
  )
}
