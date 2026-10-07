import { MonitorSmartphone } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground",
        className
      )}
    >
      <MonitorSmartphone className="size-4.5" />
    </span>
  )
}

export function BrandName({ className }: { className?: string }) {
  return (
    <span className={cn("text-base font-semibold tracking-tight", className)}>
      Acesso remoto
    </span>
  )
}
