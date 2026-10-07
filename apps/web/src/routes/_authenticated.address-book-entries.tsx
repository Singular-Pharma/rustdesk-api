import { createFileRoute } from "@tanstack/react-router"
import { EntryList } from "@/features/address-books/components/entry-list"
import { entrySearchSchema } from "@/features/address-books/schemas"

export const Route = createFileRoute("/_authenticated/address-book-entries")({
  validateSearch: entrySearchSchema,
  component: EntryList,
})
