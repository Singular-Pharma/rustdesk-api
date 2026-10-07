import { useId, type ReactNode } from "react"
import { cn } from "@workspace/ui/lib/utils"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export function Panel({
  title,
  action,
  fill = false,
  children,
}: {
  title: string
  action?: ReactNode
  fill?: boolean
  children: ReactNode
}) {
  const titleId = useId()

  return (
    <Card
      role="region"
      aria-labelledby={titleId}
      className={cn("gap-0 py-0 shadow-none", fill && "h-full")}
    >
      <CardHeader className="border-b bg-muted/50 py-3 [.border-b]:pb-3">
        <CardTitle id={titleId} role="heading" aria-level={2}>
          {title}
        </CardTitle>
        {action && <CardAction className="self-center">{action}</CardAction>}
      </CardHeader>
      <CardContent
        className={cn(
          "py-(--card-spacing)",
          fill && "flex min-h-0 flex-1 flex-col"
        )}
      >
        {children}
      </CardContent>
    </Card>
  )
}
