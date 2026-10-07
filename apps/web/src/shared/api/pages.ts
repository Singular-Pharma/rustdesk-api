import { z } from "zod"
import { getData } from "./http-client"

export type Page<T> = { list: T[]; total: number }

export const everyRecord = 1000

export function pageSchema<T>(item: z.ZodType<T>) {
  return z.object({
    list: z
      .array(item)
      .nullish()
      .transform((list) => list ?? []),
    total: z.number(),
  })
}

export function fetchPage<T>(
  url: string,
  item: z.ZodType<T>,
  params: Record<string, unknown>,
  signal?: AbortSignal
): Promise<Page<T>> {
  return getData(url, pageSchema(item), params, signal)
}

export const serverDate = z.string().catch("")
