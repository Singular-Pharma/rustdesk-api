import { createFileRoute } from "@tanstack/react-router"
import { DeviceForm } from "@/features/devices/components/device-form"

export const Route = createFileRoute("/_authenticated/devices/new")({
  component: () => <DeviceForm />,
})
