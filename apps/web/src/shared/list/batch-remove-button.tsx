import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { ConfirmDialog } from "@/shared/components/confirm-dialog"

export function BatchRemoveButton({
  count,
  noun,
  consequence,
  pending,
  error,
  onConfirm,
  onReset,
}: {
  count: number
  noun: { one: string; many: string }
  consequence?: string
  pending: boolean
  error: unknown
  onConfirm: (done: () => void) => void
  onReset: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  if (!count) return null
  const label = `${count} ${count === 1 ? noun.one : noun.many}`
  return (
    <>
      <Button variant="outline" onClick={() => setConfirming(true)}>
        <Trash2 data-icon="inline-start" />
        Remover {count}
      </Button>
      {confirming && (
        <ConfirmDialog
          title={`Remover ${label}?`}
          description={consequence ?? "Esta ação não pode ser desfeita."}
          confirmLabel="Remover"
          pendingLabel="Removendo…"
          pending={pending}
          error={error}
          errorFallback="Não foi possível remover os registros. Tente novamente."
          onConfirm={() => onConfirm(() => setConfirming(false))}
          onClose={() => {
            setConfirming(false)
            onReset()
          }}
        />
      )}
    </>
  )
}
