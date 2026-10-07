import { createFileRoute } from "@tanstack/react-router"
import { EditUser } from "@/features/users/components/user-form"

export const Route = createFileRoute("/_authenticated/users/$userId/edit")({
  component: Edit,
})

function Edit() {
  const { userId } = Route.useParams()
  return <EditUser key={userId} id={Number(userId)} />
}
