import { createFileRoute } from "@tanstack/react-router"
import { LoginList } from "@/features/audit/components/login-list"
import { userFilterSchema } from "@/features/audit/schemas"

export const Route = createFileRoute("/_authenticated/audit/logins")({
  validateSearch: userFilterSchema,
  component: LoginList,
})
