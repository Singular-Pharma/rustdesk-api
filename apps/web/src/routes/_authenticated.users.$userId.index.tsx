import { createFileRoute } from "@tanstack/react-router"
import { UserDetail } from "@/features/users/components/user-detail"

export const Route = createFileRoute("/_authenticated/users/$userId/")({
  component: Detail,
})

function Detail() {
  const { userId } = Route.useParams()
  return <UserDetail key={userId} id={Number(userId)} />
}
