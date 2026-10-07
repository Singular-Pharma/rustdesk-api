import { Input } from "@workspace/ui/components/input"
import { FilterSelect } from "@/shared/list/filter-select"
import { useUserNames } from "@/features/users/api/users-api"

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

export function UserFilterSelect({
  value,
  onChange,
}: {
  value: number | undefined
  onChange: (value: number | undefined) => void
}) {
  const users = useUserNames()
  return (
    <FilterSelect
      label="Usuário"
      options={[{ value: "all", label: "Todos os usuários" }, ...users.options]}
      value={value ? String(value) : undefined}
      onChange={(user) => onChange(user ? Number(user) : undefined)}
    />
  )
}
