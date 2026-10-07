import { createFileRoute } from "@tanstack/react-router"
import { CollectionList } from "@/features/address-books/components/collection-list"
import { collectionSearchSchema } from "@/features/address-books/schemas"

export const Route = createFileRoute("/_authenticated/address-books/")({
  validateSearch: collectionSearchSchema,
  component: CollectionList,
})
