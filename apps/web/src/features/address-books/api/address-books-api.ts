import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { postData } from "@/shared/api/http-client"
import { everyRecord, serverDate } from "@/shared/api/pages"
import { adminResource } from "@/shared/api/resource"
import { infinitePageSize, nextPageOf } from "@/shared/list/infinite-list"

const collectionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  created_at: serverDate,
})

const ruleSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  collection_id: z.number(),
  rule: z.number(),
  type: z.number(),
  to_id: z.number(),
  created_at: serverDate,
})

const entrySchema = z.object({
  row_id: z.number(),
  id: z.string(),
  username: z.string(),
  hostname: z.string(),
  alias: z.string(),
  platform: z.string(),
  tags: z
    .array(z.string())
    .nullish()
    .catch([])
    .transform((tags) => tags ?? []),
  user_id: z.number(),
  forceAlwaysRelay: z.boolean(),
  rdpPort: z.string(),
  rdpUsername: z.string(),
  collection_id: z.number(),
})

const tagSchema = z.object({
  id: z.number(),
  name: z.string(),
  user_id: z.number(),
  color: z.number(),
  collection_id: z.number(),
})

export type Collection = z.infer<typeof collectionSchema>
export type Rule = z.infer<typeof ruleSchema>
export type Entry = z.infer<typeof entrySchema>
export type Tag = z.infer<typeof tagSchema>

export type CollectionInput = Pick<Collection, "user_id" | "name">
export type RuleInput = Pick<
  Rule,
  "user_id" | "collection_id" | "rule" | "type" | "to_id"
>
export type EntryInput = Omit<Entry, "row_id"> & { password?: string }
export type TagInput = Omit<Tag, "id">

export const collections = adminResource(
  "/address_book_collection",
  collectionSchema
)
export const rules = adminResource("/address_book_collection_rule", ruleSchema)
export const tags = adminResource("/tag", tagSchema)
const entries = adminResource("/address_book", entrySchema)

export const collectionsKey = ["address-books", "collections"] as const
export const rulesKey = ["address-books", "rules"] as const
export const entriesKey = ["address-books", "entries"] as const
export const tagsKey = ["address-books", "tags"] as const

export const personalCollectionId = 0
export const personalCollectionLabel = "Meu catálogo"

export const ruleTargets = { user: 1, group: 2 } as const

export const permissionLevels = [
  { value: "1", label: "Somente leitura" },
  { value: "2", label: "Leitura e escrita" },
  { value: "3", label: "Controle total" },
]

export function permissionLabel(rule: number) {
  return permissionLevels.find((level) => level.value === String(rule))?.label
}

export const platforms = [
  { value: "Windows", label: "Windows" },
  { value: "Linux", label: "Linux" },
  { value: "Mac OS", label: "macOS" },
  { value: "Android", label: "Android" },
]

export function useCollections() {
  return useQuery({
    queryKey: collectionsKey,
    queryFn: ({ signal }) =>
      collections.list({ page_size: everyRecord }, signal),
    select: (page) => page.list,
  })
}

export function useCollection(id: number) {
  return useQuery({
    queryKey: [...collectionsKey, id],
    queryFn: ({ signal }) => collections.detail(id, signal),
  })
}

export function useCollectionOptions(userId: number | undefined) {
  const list = useCollections()
  const byId = new Map(
    list.data?.map((collection) => [collection.id, collection])
  )
  return {
    name: (id: number) =>
      id === personalCollectionId
        ? personalCollectionLabel
        : byId.get(id)?.name,
    options: [
      { value: String(personalCollectionId), label: personalCollectionLabel },
      ...(list.data ?? [])
        .filter((collection) => !userId || collection.user_id === userId)
        .map((collection) => ({
          value: String(collection.id),
          label: collection.name,
        })),
    ],
  }
}

export function useRules(collectionId?: number) {
  return useQuery({
    queryKey: [...rulesKey, collectionId ?? "all"],
    queryFn: ({ signal }) =>
      rules.list(
        { collection_id: collectionId, page_size: everyRecord },
        signal
      ),
    select: (page) => page.list,
  })
}

export function useTags(params: { user_id?: number; collection_id?: number }) {
  return useQuery({
    queryKey: [...tagsKey, params],
    queryFn: ({ signal }) =>
      tags.list({ ...params, page_size: everyRecord }, signal),
    select: (page) => page.list,
  })
}

export type EntryFilters = {
  user_id?: number
  collection_id?: number
  id?: string
  hostname?: string
}

export function useEntries(filters: EntryFilters) {
  return useInfiniteQuery({
    queryKey: [...entriesKey, filters],
    queryFn: ({ pageParam, signal }) =>
      entries.list(
        { ...filters, page: pageParam, page_size: infinitePageSize },
        signal
      ),
    initialPageParam: 1,
    getNextPageParam: nextPageOf,
  })
}

export function saveEntry(entry: EntryInput, rowId?: number) {
  return rowId
    ? entries.update({ row_id: rowId, ...entry })
    : entries.create(entry)
}

export function removeEntry(entry: Entry) {
  return postData("/address_book/delete", {
    row_id: entry.row_id,
    id: entry.id,
  })
}

export function entryName(entry: Pick<Entry, "alias" | "hostname" | "id">) {
  return entry.alias || entry.hostname || entry.id
}

export function tagColorToHex(color: number) {
  return `#${(color & 0xffffff).toString(16).padStart(6, "0")}`
}

export function hexToTagColor(hex: string) {
  return 0xff000000 + Number.parseInt(hex.slice(1), 16)
}
