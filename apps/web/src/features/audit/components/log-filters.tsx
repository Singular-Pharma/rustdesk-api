import { Input } from "@workspace/ui/components/input"

export function OriginFilter({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (value: string | undefined) => void
}) {
  return (
    <Input
      aria-label="ID de origem"
      placeholder="ID de origem"
      inputMode="numeric"
      className="w-40 font-mono"
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value || undefined)}
    />
  )
}
