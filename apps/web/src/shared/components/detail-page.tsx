import { LoadingLine } from "@/shared/components/loading-line"
import { useId, type ReactNode } from "react"
import { Link, type LinkProps } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { RequestError } from "./request-error"

export function DetailPage<T>({
  back,
  backLabel,
  query,
  loadingLabel,
  errorFallback,
  notFound,
  failure,
  children,
}: {
  back: LinkProps["to"]
  backLabel: string
  query: {
    isPending: boolean
    isError: boolean
    error: unknown
    data: T | undefined
    refetch: () => unknown
  }
  loadingLabel: string
  errorFallback: string
  notFound: string
  failure?: ReactNode
  children: (data: T) => ReactNode
}) {
  return (
    <div className="flex flex-col gap-8">
      <Button
        variant="ghost"
        className="-ml-3 w-fit"
        render={<Link to={back} />}
        nativeButton={false}
        role="link"
      >
        <ArrowLeft data-icon="inline-start" />
        {backLabel}
      </Button>
      {query.isPending ? (
        <LoadingLine label={loadingLabel} />
      ) : query.isError && failure ? (
        failure
      ) : query.isError || query.data === undefined ? (
        <RequestError
          error={query.error}
          fallback={errorFallback}
          notFound={notFound}
          retry={() => void query.refetch()}
        />
      ) : (
        children(query.data)
      )}
    </div>
  )
}

export function DetailSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  const headingId = useId()
  return (
    <section className="flex flex-col gap-4" aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
