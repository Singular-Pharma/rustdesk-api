import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export function SortHeader({
  label,
  descending,
  toggle,
  className,
}: {
  label: string
  descending: boolean | undefined
  toggle: () => void
  className?: string
}) {
  const Arrow =
    descending === undefined ? ArrowUpDown : descending ? ArrowDown : ArrowUp

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-3", className)}
      onClick={toggle}
    >
      {label}
      <Arrow
        data-icon="inline-end"
        className={cn(descending === undefined && "text-muted-foreground")}
      />
    </Button>
  )
}
