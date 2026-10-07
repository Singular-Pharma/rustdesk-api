import type { z } from "zod"
import { getData, postData } from "./http-client"
import { fetchPage } from "./pages"

export function adminResource<T>(path: string, item: z.ZodType<T>) {
  return {
    list: (params: Record<string, unknown>, signal?: AbortSignal) =>
      fetchPage(`${path}/list`, item, params, signal),
    detail: (id: number | string, signal?: AbortSignal) =>
      getData(
        `${path}/detail/${encodeURIComponent(id)}`,
        item,
        undefined,
        signal
      ),
    create: (body: unknown) => postData(`${path}/create`, body),
    update: (body: unknown) => postData(`${path}/update`, body),
    remove: (body: unknown) => postData(`${path}/delete`, body),
    removeMany: (body: unknown) => postData(`${path}/batchDelete`, body),
  }
}
