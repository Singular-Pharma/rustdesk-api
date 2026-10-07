import type { ReactNode } from "react"
import { Card, CardContent } from "@workspace/ui/components/card"

export function Kpi({
  label,
  value,
  children,
}: {
  label: string
  value: string
  children?: ReactNode
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-2xl font-semibold whitespace-nowrap tabular-nums">
          {value}
        </span>
        {children && (
          <div className="flex flex-col gap-0.5 text-xs">{children}</div>
        )}
      </CardContent>
    </Card>
  )
}
