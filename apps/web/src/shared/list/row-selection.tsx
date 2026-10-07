import { useState } from "react"
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table"
import { Checkbox } from "@workspace/ui/components/checkbox"

export function selectionColumn<T>(describe: (item: T) => string): ColumnDef<T> {
  return {
    id: "select",
    enableSorting: false,
    header: ({ table }) => (
      <Checkbox
        aria-label="Selecionar todos os registros carregados"
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected()}
        onCheckedChange={(checked) => table.toggleAllRowsSelected(!!checked)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={`Selecionar ${describe(row.original)}`}
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(!!checked)}
      />
    ),
  }
}

export function useRowSelection() {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const selectedIds = Object.keys(rowSelection)
    .filter((id) => rowSelection[id])
    .map(Number)
  return {
    rowSelection,
    setRowSelection,
    selectedIds,
    clear: () => setRowSelection({}),
  }
}
