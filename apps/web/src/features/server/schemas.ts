import { z } from "zod"
import { optionalText } from "@/shared/list/search"
import { serverTargets } from "./api/server-api"

export const commandSearchSchema = z.object({
  q: optionalText,
  target: z
    .enum([serverTargets.id, serverTargets.relay])
    .optional()
    .catch(undefined),
})

export type CommandSearch = z.infer<typeof commandSearchSchema>
