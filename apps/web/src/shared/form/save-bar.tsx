import type { ReactElement } from "react"
import { Button } from "@workspace/ui/components/button"
import { PendingButton } from "@/shared/components/pending-button"
import { cn } from "@workspace/ui/lib/utils"
import { useStuckToBottom } from "@/shared/motion/use-stuck-to-bottom"

export function SaveBar({
  cancel,
  pending,
  label,
}: {
  cancel: ReactElement
  pending: boolean
  label: string
}) {
  const { bar, stuck } = useStuckToBottom()
  return (
    <div
      ref={bar}
      data-stuck={stuck || undefined}
      className={cn(
        "sticky bottom-0 flex justify-end gap-3 border-t border-transparent bg-background py-5 transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
        stuck && "border-border shadow-[0_-12px_16px_-16px_rgb(0_0_0/0.35)]"
      )}
    >
      <Button
        variant="outline"
        disabled={pending}
        render={cancel}
        nativeButton={false}
        role="link"
      >
        Cancelar
      </Button>
      <PendingButton
        type="submit"
        pending={pending}
        label={label}
        pendingLabel="Salvando…"
      />
    </div>
  )
}
