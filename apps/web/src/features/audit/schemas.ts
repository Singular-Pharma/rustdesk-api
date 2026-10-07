import { z } from "zod"
import { optionalId, optionalText } from "@/shared/list/search"

export const peerSearchSchema = z.object({
  q: optionalText,
  from: optionalText,
})

export const userFilterSchema = z.object({ user: optionalId })

export type PeerSearch = z.infer<typeof peerSearchSchema>
export type UserFilter = z.infer<typeof userFilterSchema>
