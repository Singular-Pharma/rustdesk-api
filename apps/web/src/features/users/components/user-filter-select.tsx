import { FilterSelect } from "@/shared/list/filter-select"
import { useUserNames } from "../api/users-api"

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
