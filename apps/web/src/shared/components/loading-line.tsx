import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"
import { useDelayedVisibility } from "@/shared/motion/use-delayed-visibility"

export function LoadingLine({
  label,
  className = "py-10",
}: {
  label: string
  className?: string
}) {
  const { visible } = useDelayedVisibility(true)
  return (
    <p
      role="status"
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground transition-opacity duration-150 motion-reduce:transition-none",
        !visible && "opacity-0",
        className
      )}
    >
      <Spinner />
      {label}
    </p>
  )
}
