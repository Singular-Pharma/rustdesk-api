import { useRef, type ReactNode } from "react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { useAuthStore } from "@/stores/auth-store"
import { PendingButton } from "./pending-button"
import { RequestError } from "./request-error"

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  pendingLabel,
  pending,
  error,
  errorFallback,
  onConfirm,
  onClose,
}: {
  title: string
  description: ReactNode
  confirmLabel: string
  pendingLabel: string
  pending: boolean
  error: unknown
  errorFallback: string
  onConfirm: () => void
  onClose: () => void
}) {
  const session = useAuthStore((state) => state.session)
  const cancel = useRef<HTMLButtonElement>(null)
  return (
    <AlertDialog
      open={!!session}
      onOpenChange={(open) => {
        if (!open && !pending) onClose()
      }}
    >
      <AlertDialogContent initialFocus={cancel}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {!!error && <RequestError error={error} fallback={errorFallback} />}
        <AlertDialogFooter>
          <AlertDialogCancel ref={cancel} disabled={pending}>
            Cancelar
          </AlertDialogCancel>
          <PendingButton
            variant="destructive"
            onClick={onConfirm}
            pending={pending}
            label={confirmLabel}
            pendingLabel={pendingLabel}
          />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
