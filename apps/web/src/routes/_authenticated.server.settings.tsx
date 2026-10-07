import { createFileRoute } from "@tanstack/react-router"
import { ServerSettings } from "@/features/server/components/server-settings"

export const Route = createFileRoute("/_authenticated/server/settings")({
  component: ServerSettings,
})
