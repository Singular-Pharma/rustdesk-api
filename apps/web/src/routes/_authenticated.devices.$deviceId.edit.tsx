import { createFileRoute } from "@tanstack/react-router"
import { EditDevice } from "@/features/devices/components/device-form"

export const Route = createFileRoute("/_authenticated/devices/$deviceId/edit")({
  component: Edit,
})

function Edit() {
  const { deviceId } = Route.useParams()
  return <EditDevice key={deviceId} rowId={Number(deviceId)} />
}
