import { Fragment, type ComponentType, type ReactElement } from "react"
import { Ellipsis } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

export type RowAction = {
  label: string
  icon: ComponentType
  render?: ReactElement
  onSelect?: () => void
  destructive?: boolean
}

export function RowActions({
  name,
  actions,
}: {
  name: string
  actions: RowAction[]
}) {
  const regular = actions.filter((action) => !action.destructive)
  const destructive = actions.filter((action) => action.destructive)
  const groups = [regular, destructive].filter((group) => group.length)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" />}
        aria-label={`Ações de ${name}`}
      >
        <Ellipsis />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {groups.map((group, index) => (
          <Fragment key={index}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuGroup>
              {group.map(
                ({ label, icon: Icon, render, onSelect, destructive }) => (
                  <DropdownMenuItem
                    key={label}
                    render={render}
                    onClick={onSelect}
                    variant={destructive ? "destructive" : "default"}
                  >
                    <Icon />
                    {label}
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuGroup>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
