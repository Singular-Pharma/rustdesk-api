import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { MonitorUp, Pencil, Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { CopyButton } from "@/shared/components/copy-button"
import { DetailItem } from "@/shared/components/detail-item"
import { DetailPage, DetailSection } from "@/shared/components/detail-page"
import { formatServerDateTime, formatUnixTime } from "@/shared/format"
import { useGroupNames } from "@/features/groups/api/groups-api"
import { useUserNames } from "@/features/users/api/users-api"
import { deviceName, remoteLink, useDevice } from "../api/devices-api"
import { LastSeen } from "./last-seen"
import { RemoveDeviceDialog } from "./remove-device-dialog"

function Code({ children }: { children: string }) {
  return (
    <span className="font-mono text-sm break-all text-foreground/90">
      {children}
    </span>
  )
}

export function DeviceDetail({ rowId }: { rowId: number }) {
  const query = useDevice(rowId)
  const groups = useGroupNames("device")
  const users = useUserNames()
  const [removing, setRemoving] = useState(false)
  return (
    <DetailPage
      back="/devices"
      backLabel="Voltar para dispositivos"
      query={query}
      loadingLabel="Carregando dispositivo…"
      errorFallback="Não foi possível carregar o dispositivo."
      notFound="Este dispositivo não está mais disponível."
    >
      {(device) => {
        const machine = [
          ["Nome do computador", device.hostname],
          ["Usuário do sistema", device.username],
          ["Sistema operacional", device.os],
          ["Versão do aplicativo", device.version],
          ["Processador", device.cpu],
          ["Memória", device.memory],
        ].filter(([, value]) => value)
        return (
          <>
            <header className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex min-w-0 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h1 className="text-3xl font-semibold tracking-tight break-words">
                    {deviceName(device)}
                  </h1>
                  <span className="inline-flex items-center gap-1 font-mono text-sm text-muted-foreground tabular-nums">
                    {device.id}
                    <CopyButton value={device.id} label="ID do dispositivo" />
                  </span>
                </div>
                <LastSeen seconds={device.last_online_time} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  render={<a href={remoteLink(device)} />}
                  nativeButton={false}
                >
                  <MonitorUp data-icon="inline-start" />
                  Conectar
                </Button>
                <Button
                  render={
                    <Link
                      to="/devices/$deviceId/edit"
                      params={{ deviceId: String(device.row_id) }}
                    />
                  }
                  nativeButton={false}
                  role="link"
                >
                  <Pencil data-icon="inline-start" />
                  Editar dispositivo
                </Button>
              </div>
            </header>
            <Separator />
            <DetailSection title="Acesso">
              <dl className="grid gap-6 sm:grid-cols-3">
                <DetailItem label="Grupo">
                  {groups.name(device.group_id) ?? "Sem grupo"}
                </DetailItem>
                <DetailItem label="Conta vinculada">
                  {users.name(device.user_id) ?? "Nenhuma"}
                </DetailItem>
                {device.last_online_time > 0 && (
                  <DetailItem label="Último contato">
                    <span className="tabular-nums">
                      {formatUnixTime(device.last_online_time)}
                    </span>
                  </DetailItem>
                )}
                {device.last_online_ip && (
                  <DetailItem label="Último IP">
                    <Code>{device.last_online_ip}</Code>
                  </DetailItem>
                )}
              </dl>
            </DetailSection>
            {machine.length > 0 && (
              <DetailSection title="Máquina">
                <dl className="grid gap-6 sm:grid-cols-3">
                  {machine.map(([label, value]) => (
                    <DetailItem key={label} label={label}>
                      {value}
                    </DetailItem>
                  ))}
                </dl>
              </DetailSection>
            )}
            <DetailSection title="Cadastro">
              <dl className="grid gap-6 sm:grid-cols-3">
                {device.uuid && (
                  <DetailItem label="UUID">
                    <Code>{device.uuid}</Code>
                  </DetailItem>
                )}
                {device.created_at && (
                  <DetailItem label="Cadastrado em">
                    <span className="tabular-nums">
                      {formatServerDateTime(device.created_at)}
                    </span>
                  </DetailItem>
                )}
                {device.updated_at && (
                  <DetailItem label="Última atualização">
                    <span className="tabular-nums">
                      {formatServerDateTime(device.updated_at)}
                    </span>
                  </DetailItem>
                )}
              </dl>
            </DetailSection>
            <Separator />
            <div className="flex justify-end">
              <Button variant="destructive" onClick={() => setRemoving(true)}>
                <Trash2 data-icon="inline-start" />
                Remover dispositivo
              </Button>
            </div>
            {removing && (
              <RemoveDeviceDialog
                device={device}
                onClose={() => setRemoving(false)}
                fromDetail
              />
            )}
          </>
        )
      }}
    </DetailPage>
  )
}
