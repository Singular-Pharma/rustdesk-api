import type { ComponentProps, ReactNode } from "react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"

export function PendingButton({
  pending,
  label,
  pendingLabel,
  icon,
  className,
  onClick,
  disabled,
  ...props
}: Omit<ComponentProps<typeof Button>, "children"> & {
  pending: boolean
  label: string
  pendingLabel: string
  icon?: ReactNode
}) {
  const layer =
    "col-start-1 row-start-1 inline-flex items-center justify-center gap-1.5 transition-opacity duration-150 motion-reduce:transition-none"
  return (
    <Button
      {...props}
      disabled={disabled && !pending}
      aria-busy={pending || undefined}
      aria-disabled={pending || undefined}
      className={cn("grid aria-busy:cursor-progress", className)}
      onClick={(event) => {
        if (pending) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
    >
      <span className={cn(layer, pending && "opacity-0")} aria-hidden={pending}>
        {icon}
        {label}
      </span>
      <span
        className={cn(layer, !pending && "opacity-0")}
        aria-hidden={!pending}
      >
        <Spinner />
        {pendingLabel}
      </span>
    </Button>
  )
}
