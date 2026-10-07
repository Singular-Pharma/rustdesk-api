import { useNavigate } from "@tanstack/react-router"
import { useAdminMutation } from "@/shared/api/mutation"
import { ConfirmDialog } from "@/shared/components/confirm-dialog"
import {
  deviceName,
  devices,
  devicesKey,
  type Device,
} from "../api/devices-api"

export function RemoveDeviceDialog({
  device,
  onClose,
  fromDetail = false,
}: {
  device: Device
  onClose: () => void
  fromDetail?: boolean
}) {
  const navigate = useNavigate()
  const remove = useAdminMutation(
    () => devices.remove({ row_id: device.row_id }),
    [devicesKey]
  )
  return (
    <ConfirmDialog
      title="Remover dispositivo?"
      description={
        <>
          <strong>{deviceName(device)}</strong> sai da lista. Se o aplicativo
          continuar instalado e conectado, ele volta a aparecer.
        </>
      }
      confirmLabel="Remover dispositivo"
      pendingLabel="Removendo…"
      pending={remove.isPending}
      error={remove.error}
      errorFallback="Não foi possível remover o dispositivo. Tente novamente."
      onConfirm={() =>
        remove.mutate(undefined, {
          onSuccess: () => {
            onClose()
            if (fromDetail) void navigate({ to: "/devices" })
          },
        })
      }
      onClose={onClose}
    />
  )
}
