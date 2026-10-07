import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { adminResource } from "@/shared/api/resource"
import { everyRecord } from "@/shared/api/pages"

export const userGroupTypes = [
  { value: "1", label: "Padrão" },
  { value: "2", label: "Compartilhado" },
]

const groupSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.number().optional(),
})

export type Group = z.infer<typeof groupSchema>
export type GroupKind = "user" | "device"

export const groupResources = {
  user: adminResource("/group", groupSchema),
  device: adminResource("/device_group", groupSchema),
}

export const groupsKey = (kind: GroupKind) => ["groups", kind] as const

export function useGroups(kind: GroupKind) {
  return useQuery({
    queryKey: groupsKey(kind),
    queryFn: ({ signal }) =>
      groupResources[kind].list({ page_size: everyRecord }, signal),
    select: (page) => page.list,
  })
}

export function useGroupNames(kind: GroupKind) {
  const groups = useGroups(kind)
  const names = new Map(groups.data?.map((group) => [group.id, group.name]))
  return {
    name: (id: number) => (id ? names.get(id) : undefined),
    options: (groups.data ?? []).map((group) => ({
      value: String(group.id),
      label: group.name,
    })),
  }
}
