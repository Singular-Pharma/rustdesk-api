import { z } from "zod"
import { optionalId, optionalText } from "@/shared/list/search"

const optionalCollection = z.coerce
  .number()
  .int()
  .min(0)
  .optional()
  .catch(undefined)

export const collectionSearchSchema = z.object({
  q: optionalText,
  user: optionalId,
})

export const entrySearchSchema = z.object({
  q: optionalText,
  user: optionalId,
  collection: optionalCollection,
})

export const tagSearchSchema = entrySearchSchema

export type CollectionSearch = z.infer<typeof collectionSearchSchema>
export type EntrySearch = z.infer<typeof entrySearchSchema>
export type TagSearch = z.infer<typeof tagSearchSchema>
