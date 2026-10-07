import { cn } from "@workspace/ui/lib/utils"
import { formatSince, formatUnixTime, isOnline } from "@/shared/format"

export function LastSeen({ seconds }: { seconds: number }) {
  if (!seconds) return <span className="text-muted-foreground">Nunca</span>
  const online = isOnline(seconds)
  return (
    <span
      className="inline-flex items-center gap-2 whitespace-nowrap"
      title={formatUnixTime(seconds)}
    >
      <span
        aria-hidden
        className={cn(
          "size-2 shrink-0 rounded-full",
          online ? "bg-emerald-500" : "bg-muted-foreground/40"
        )}
      />
      <span className={cn("tabular-nums", !online && "text-muted-foreground")}>
        {online ? "Online" : formatSince(seconds)}
      </span>
    </span>
  )
}
