import { useMemo } from "react"
import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from "@tanstack/react-query"
import type { LoadMore } from "@/shared/components/list-screen"
import type { Page } from "@/shared/api/pages"

export const infinitePageSize = 25

export function nextPageOf<T>(last: Page<T>, pages: Page<T>[]) {
  const loaded = pages.reduce((count, page) => count + page.list.length, 0)
  return last.list.length && loaded < last.total ? pages.length + 1 : undefined
}

export function useInfiniteRows<T>(
  query: UseInfiniteQueryResult<InfiniteData<Page<T>>>
) {
  const pages = query.data?.pages
  const rows = useMemo(() => pages?.flatMap((page) => page.list) ?? [], [pages])
  const loadMore: LoadMore = {
    hasMore: query.hasNextPage,
    loading: query.isFetchingNextPage,
    load: () => void query.fetchNextPage(),
  }
  return { rows, total: pages?.at(-1)?.total ?? 0, loadMore }
}
