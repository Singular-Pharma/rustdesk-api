import { createFileRoute } from "@tanstack/react-router"
import { ShareList } from "@/features/audit/components/share-list"
import { userFilterSchema } from "@/features/audit/schemas"

export const Route = createFileRoute("/_authenticated/audit/shares")({
  validateSearch: userFilterSchema,
  component: ShareList,
})
