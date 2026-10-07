import { createFileRoute } from "@tanstack/react-router"
import { CollectionDetail } from "@/features/address-books/components/collection-detail"

export const Route = createFileRoute(
  "/_authenticated/address-books/$collectionId"
)({
  component: Detail,
})

function Detail() {
  const { collectionId } = Route.useParams()
  return <CollectionDetail key={collectionId} id={Number(collectionId)} />
}
