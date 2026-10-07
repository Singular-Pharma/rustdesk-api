import { createFileRoute } from "@tanstack/react-router"
import { GroupList } from "@/features/groups/components/group-list"
import { textSearchSchema } from "@/shared/list/search"

export const Route = createFileRoute("/_authenticated/user-groups")({
  validateSearch: textSearchSchema,
  component: () => <GroupList key="user" kind="user" />,
})
