import { createFileRoute } from "@tanstack/react-router"
import { UserList } from "@/features/users/components/user-list"
import { userSearchSchema } from "@/features/users/schemas"

export const Route = createFileRoute("/_authenticated/users/")({
  validateSearch: userSearchSchema,
  component: UserList,
})
