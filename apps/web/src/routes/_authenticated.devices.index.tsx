import { createFileRoute } from "@tanstack/react-router"
import { DeviceList } from "@/features/devices/components/device-list"
import { deviceSearchSchema } from "@/features/devices/schemas"

export const Route = createFileRoute("/_authenticated/devices/")({
  validateSearch: deviceSearchSchema,
  component: DeviceList,
})
