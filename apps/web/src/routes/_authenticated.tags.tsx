import { createFileRoute } from "@tanstack/react-router"
import { TagList } from "@/features/address-books/components/tag-list"
import { tagSearchSchema } from "@/features/address-books/schemas"

export const Route = createFileRoute("/_authenticated/tags")({
  validateSearch: tagSearchSchema,
  component: TagList,
})
