import { createFileRoute } from "@tanstack/react-router"
import { DeviceDetail } from "@/features/devices/components/device-detail"

export const Route = createFileRoute("/_authenticated/devices/$deviceId/")({
  component: Detail,
})

function Detail() {
  const { deviceId } = Route.useParams()
  return <DeviceDetail key={deviceId} rowId={Number(deviceId)} />
}
