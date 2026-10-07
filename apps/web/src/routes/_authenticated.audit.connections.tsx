import { createFileRoute } from "@tanstack/react-router"
import { ConnectionList } from "@/features/audit/components/connection-list"
import { peerSearchSchema } from "@/features/audit/schemas"

export const Route = createFileRoute("/_authenticated/audit/connections")({
  validateSearch: peerSearchSchema,
  component: ConnectionList,
})
