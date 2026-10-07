import type { FormEventHandler, ReactNode } from "react"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { cn } from "@workspace/ui/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import { PendingButton } from "./pending-button"
import { RequestError } from "./request-error"

export function FormDialog({
  title,
  wide = false,
  pending,
  error,
  errorFallback,
  notFound,
  submitLabel,
  onSubmit,
  onClose,
  children,
}: {
  title: string
  wide?: boolean
  pending: boolean
  error: unknown
  errorFallback: string
  notFound?: string
  submitLabel: string
  onSubmit: FormEventHandler<HTMLFormElement>
  onClose: () => void
  children: ReactNode
}) {
  const session = useAuthStore((state) => state.session)
  return (
    <Dialog
      open={!!session}
      onOpenChange={(open) => {
        if (!open && !pending) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className={cn(
          "max-h-[calc(100svh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] p-0",
          wide && "sm:max-w-2xl"
        )}
      >
        <form
          onSubmit={onSubmit}
          noValidate
          aria-busy={pending}
          className="contents"
        >
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="grid content-start gap-4 overflow-y-auto px-6 py-1">
            {children}
            {!!error && (
              <RequestError
                error={error}
                fallback={errorFallback}
                notFound={notFound}
              />
            )}
          </div>
          <DialogFooter className="px-6 pb-6">
            <DialogClose
              render={<Button type="button" variant="outline" />}
              disabled={pending}
            >
              Cancelar
            </DialogClose>
            <PendingButton
              type="submit"
              pending={pending}
              label={submitLabel}
              pendingLabel="Salvando…"
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
