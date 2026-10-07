import { useEffect, useRef, useState, type ReactNode } from "react"
import { flexRender, type Table as TableInstance } from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, RefreshCw, Search, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { useDelayedVisibility } from "@/shared/motion/use-delayed-visibility"
import { RequestError } from "./request-error"

const pageSizes = [10, 25, 50].map((value) => ({ value, label: String(value) }))
const infiniteBatch = 25
const prefetchDistance = "400px"

export type LoadMore = {
  hasMore: boolean
  loading: boolean
  load: () => void
}

type ListScreenProps<T> = {
  label: string
  table: TableInstance<T>
  search?: {
    value: string
    placeholder: string
    onChange: (value: string) => void
  }
  filters?: ReactNode
  primary: ReactNode
  filtered: boolean
  clearFilters: () => void
  loading: boolean
  refreshing: boolean
  error: unknown
  errorMessage: string
  refresh: () => void
  emptyMessage: string
  mobileRow: (item: T) => ReactNode
  pagination?: "infinite" | "pages"
  loadMore?: LoadMore
  contained?: boolean
  children?: ReactNode
}

export function ListScreen<T>({
  label,
  table,
  search,
  filters,
  primary,
  filtered,
  clearFilters,
  loading,
  refreshing,
  error,
  errorMessage,
  refresh,
  emptyMessage,
  mobileRow,
  pagination = "infinite",
  loadMore,
  contained = false,
  children,
}: ListScreenProps<T>) {
  const screen = useRef<HTMLElement>(null)
  const scrollAfterPageChange = useRef(false)
  const isMobile = useIsMobile()
  const skeleton = useDelayedVisibility(loading)
  const { pageIndex, pageSize } = table.getState().pagination
  const total = table.getRowCount()
  const infinite = pagination === "infinite"
  const loadedRows = table.getPrePaginationRowModel().rows
  const [batch, setBatch] = useState({ total, shown: infiniteBatch })
  if (batch.total !== total) setBatch({ total, shown: infiniteBatch })
  const rows = infinite
    ? loadedRows.slice(0, batch.shown)
    : table.getRowModel().rows
  const start = pageIndex * pageSize + 1
  const end = Math.min(start + pageSize - 1, total)
  const hasHiddenRows = rows.length < loadedRows.length
  const canGrow = infinite && (hasHiddenRows || !!loadMore?.hasMore)

  useEffect(() => {
    if (!scrollAfterPageChange.current) return
    scrollAfterPageChange.current = false
    screen.current?.focus({ preventScroll: true })
    screen.current?.scrollIntoView({ block: "start", behavior: "instant" })
  }, [pageIndex, pageSize])

  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null)
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!sentinel || !canGrow) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        if (hasHiddenRows)
          setBatch((current) => ({
            ...current,
            shown: current.shown + infiniteBatch,
          }))
        else if (loadMore && !loadMore.loading) loadMore.load()
      },
      { root: contained ? scroller : null, rootMargin: prefetchDistance }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [
    sentinel,
    scroller,
    contained,
    canGrow,
    hasHiddenRows,
    rows.length,
    loadMore,
  ])

  function changePage(change: () => void) {
    scrollAfterPageChange.current = isMobile
    change()
  }

  return (
    <section
      ref={screen}
      tabIndex={-1}
      data-slot="list-screen"
      className={cn(
        "flex min-w-0 scroll-mt-24 flex-col gap-5 outline-none",
        contained && "h-full min-h-0"
      )}
      aria-label={label}
      aria-busy={loading || refreshing || undefined}
    >
      <div
        data-slot="list-toolbar"
        className="flex flex-wrap items-center gap-2"
      >
        {search && (
          <InputGroup className="w-full sm:w-72 lg:w-80">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              aria-label={search.placeholder}
              placeholder={search.placeholder}
              value={search.value}
              onChange={(event) => search.onChange(event.target.value)}
            />
            {search.value && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-sm"
                  aria-label="Limpar busca"
                  onClick={() => search.onChange("")}
                >
                  <X />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
        )}
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {filters}
          {filtered && (
            <Button variant="ghost" onClick={clearFilters}>
              <X data-icon="inline-start" />
              Limpar filtros
            </Button>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Atualizar ${label.toLocaleLowerCase("pt-BR")}`}
            disabled={refreshing}
            onClick={refresh}
          >
            {refreshing ? <Spinner /> : <RefreshCw />}
          </Button>
          {primary}
        </div>
      </div>
      <p role="status" className="sr-only">
        {filtered && !loading && !error
          ? `${total} ${total === 1 ? "resultado" : "resultados"}`
          : ""}
      </p>
      {skeleton.holding ? (
        <div
          role="status"
          aria-label={`Carregando ${label.toLocaleLowerCase("pt-BR")}`}
          className={cn(
            "flex flex-col divide-y transition-opacity duration-150 motion-reduce:transition-none",
            !skeleton.visible && "opacity-0"
          )}
        >
          <span className="sr-only">Carregando…</span>
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex items-center gap-4 py-5">
              <Skeleton className="size-9 shrink-0 animate-none rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-40 animate-none" />
                <Skeleton className="h-3 w-52 max-w-full animate-none" />
              </div>
              <Skeleton className="hidden h-5 w-20 animate-none sm:block" />
            </div>
          ))}
        </div>
      ) : error ? (
        <RequestError error={error} fallback={errorMessage} retry={refresh} />
      ) : (
        <>
          <div
            ref={setScroller}
            className={cn(
              contained &&
                "min-h-0 flex-1 overflow-y-auto overscroll-contain [&_[data-slot=table-container]]:overflow-visible"
            )}
          >
            <div className="hidden md:block">
              <Table className="list-table">
                <caption className="sr-only">{label}</caption>
                <TableHeader
                  className={cn(contained && "sticky top-0 z-10 bg-card")}
                >
                  {table.getHeaderGroups().map((group) => (
                    <TableRow key={group.id}>
                      {group.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          data-column={header.id}
                          aria-sort={
                            header.column.getCanSort()
                              ? header.column.getIsSorted() === "desc"
                                ? "descending"
                                : header.column.getIsSorted() === "asc"
                                  ? "ascending"
                                  : "none"
                              : undefined
                          }
                        >
                          {!header.isPlaceholder &&
                            flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {!total && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={table.getVisibleLeafColumns().length}
                        className="py-20 text-center text-sm text-muted-foreground"
                      >
                        <p role="status">{emptyMessage}</p>
                      </TableCell>
                    </TableRow>
                  )}
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} data-column={cell.column.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {!total && (
              <p className="py-20 text-center text-sm text-muted-foreground md:hidden">
                {emptyMessage}
              </p>
            )}
            <ul
              hidden={!total}
              className="flex flex-col divide-y border-y md:hidden"
              aria-label={label}
            >
              {rows.map((row) => (
                <li key={row.id} className="py-4">
                  {mobileRow(row.original)}
                </li>
              ))}
            </ul>
            {canGrow && (
              <div
                ref={setSentinel}
                aria-hidden
                className={cn("h-px", !contained && "-mt-5")}
              />
            )}
          </div>
          {infinite && total > 0 && (
            <footer className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <p className="tabular-nums" aria-live="polite">
                {rows.length} de {total}
              </p>
              {loadMore?.loading && (
                <Spinner aria-label="Carregando mais registros" />
              )}
            </footer>
          )}
          {!infinite && total > 0 && (
            <footer className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <p className="tabular-nums" aria-live="polite">
                {start} a {end} de {total}
              </p>
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline">Por página</span>
                <Select
                  items={pageSizes}
                  value={pageSize}
                  onValueChange={(size) =>
                    size &&
                    size !== pageSize &&
                    changePage(() => table.setPageSize(size))
                  }
                >
                  <SelectTrigger
                    aria-label="Registros por página"
                    className="w-20"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {pageSizes.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Página anterior"
                    disabled={!table.getCanPreviousPage()}
                    onClick={() => changePage(() => table.previousPage())}
                  >
                    <ChevronLeft />
                  </Button>
                  <span className="min-w-8 text-center tabular-nums">
                    {pageIndex + 1}
                    <span className="sr-only"> de {table.getPageCount()}</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Próxima página"
                    disabled={!table.getCanNextPage()}
                    onClick={() => changePage(() => table.nextPage())}
                  >
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            </footer>
          )}
        </>
      )}
      {children}
    </section>
  )
}
