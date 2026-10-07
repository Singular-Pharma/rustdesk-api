import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { adminResource } from "@/shared/api/resource"
import { serverDate } from "@/shared/api/pages"
import { infinitePageSize, nextPageOf } from "@/shared/list/infinite-list"
import type { DeviceSearch } from "../schemas"

const deviceSchema = z.object({
  row_id: z.number(),
  id: z.string(),
  cpu: z.string(),
  hostname: z.string(),
  memory: z.string(),
  os: z.string(),
  username: z.string(),
  uuid: z.string(),
  version: z.string(),
  user_id: z.number(),
  last_online_time: z.number(),
  last_online_ip: z.string(),
  group_id: z.number(),
  alias: z.string(),
  created_at: serverDate,
  updated_at: serverDate,
})

export type Device = z.infer<typeof deviceSchema>

export type DeviceInput = {
  id: string
  alias: string
  hostname: string
  username: string
  os: string
  version: string
  cpu: string
  memory: string
  uuid: string
  group_id: number
}

export const devices = adminResource("/peer", deviceSchema)

export const devicesKey = ["devices"] as const

export const lastSeenWindows = {
  online: -60,
  today: -86_400,
  stale: 30 * 86_400,
} as const

function searchTarget(query: string) {
  if (/^\d[\d\s]*$/.test(query)) return { id: query.replace(/\s/g, "") }
  if (/^[\d.:a-f]+$/i.test(query) && /[.:]/.test(query)) return { ip: query }
  return { hostname: query }
}

export function deviceListParams(search: DeviceSearch) {
  const query = search.q?.trim()
  return {
    ...(query && searchTarget(query)),
    ...(search.seen && { time_ago: lastSeenWindows[search.seen] }),
  }
}

export function useDeviceList(search: DeviceSearch) {
  const params = deviceListParams(search)
  return useInfiniteQuery({
    queryKey: [...devicesKey, "list", params],
    queryFn: ({ pageParam, signal }) =>
      devices.list(
        { ...params, page: pageParam, page_size: infinitePageSize },
        signal
      ),
    initialPageParam: 1,
    getNextPageParam: nextPageOf,
  })
}

export function useDeviceCount(params: Record<string, unknown>) {
  return useQuery({
    queryKey: [...devicesKey, "count", params],
    queryFn: ({ signal }) => devices.list({ ...params, page_size: 1 }, signal),
    select: (page) => page.total,
    refetchInterval: 60_000,
  })
}

export function useDevice(rowId: number) {
  return useQuery({
    queryKey: [...devicesKey, rowId],
    queryFn: ({ signal }) => devices.detail(rowId, signal),
  })
}

export function deviceName(device: Device) {
  return device.alias || device.hostname || device.id
}

export function remoteLink(device: Pick<Device, "id">) {
  return `rustdesk://${encodeURIComponent(device.id)}`
}
