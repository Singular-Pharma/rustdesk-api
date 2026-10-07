import { useEffect, useRef, useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

const confirmationMs = 2000

async function writeToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const field = document.createElement("textarea")
    field.value = text
    field.setAttribute("readonly", "")
    field.style.position = "fixed"
    field.style.opacity = "0"
    document.body.append(field)
    const selection = document.getSelection()
    const previousRange = selection?.rangeCount ? selection.getRangeAt(0) : null
    field.select()
    const copied = document.execCommand("copy")
    field.remove()
    if (previousRange) {
      selection?.removeAllRanges()
      selection?.addRange(previousRange)
    }
    return copied
  }
}

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [outcome, setOutcome] = useState<"copied" | "failed">()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    const copied = await writeToClipboard(value)
    clearTimeout(timer.current)
    setOutcome(copied ? "copied" : "failed")
    timer.current = setTimeout(() => setOutcome(undefined), confirmationMs)
  }

  const icon =
    "col-start-1 row-start-1 transition-[opacity,scale] duration-150 motion-reduce:transition-none"
  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Copiar ${label}`}
        className="grid text-muted-foreground"
        onClick={() => void copy()}
      >
        <Copy
          className={cn(icon, outcome === "copied" && "scale-50 opacity-0")}
        />
        <Check
          className={cn(
            icon,
            "text-foreground",
            outcome !== "copied" && "scale-50 opacity-0"
          )}
        />
      </Button>
      <span role="status" className="sr-only">
        {outcome === "copied"
          ? `${label} copiado`
          : outcome === "failed"
            ? `Não foi possível copiar ${label}`
            : ""}
      </span>
    </>
  )
}
