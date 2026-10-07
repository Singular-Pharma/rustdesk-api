import { cn } from "@workspace/ui/lib/utils"
import { useId, type ReactNode } from "react"

export function FormSection({
  title,
  className,
  children,
}: {
  title: string
  className?: string
  children: ReactNode
}) {
  const id = useId()
  return (
    <section
      role="group"
      aria-labelledby={id}
      className={cn(
        "grid gap-6 py-8 first:pt-0 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12",
        className
      )}
    >
      <h2 id={id} className="text-sm font-medium">
        {title}
      </h2>
      <div className="grid content-start gap-x-6 gap-y-3 md:grid-cols-2">
        {children}
      </div>
    </section>
  )
}
