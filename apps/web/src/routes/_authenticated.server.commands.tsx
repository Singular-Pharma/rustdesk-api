import { createFileRoute } from "@tanstack/react-router"
import { CommandList } from "@/features/server/components/command-list"
import { commandSearchSchema } from "@/features/server/schemas"

export const Route = createFileRoute("/_authenticated/server/commands")({
  validateSearch: commandSearchSchema,
  component: CommandList,
})
