import { createFileRoute } from "@tanstack/react-router"
import { SessionList } from "@/features/audit/components/session-list"
import { userFilterSchema } from "@/features/audit/schemas"

export const Route = createFileRoute("/_authenticated/audit/sessions")({
  validateSearch: userFilterSchema,
  component: SessionList,
})
