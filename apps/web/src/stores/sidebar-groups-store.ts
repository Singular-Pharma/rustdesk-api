import { create } from "zustand"

const storageKey = "remoto.sidebar.closed-groups"

function readClosed(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]")
    return Array.isArray(saved)
      ? saved.filter((group) => typeof group === "string")
      : []
  } catch {
    return []
  }
}

export const useSidebarGroupsStore = create<{
  closed: string[]
  setOpen: (group: string, open: boolean) => void
}>((set) => ({
  closed: readClosed(),
  setOpen: (group, open) =>
    set((state) => {
      const closed = open
        ? state.closed.filter((item) => item !== group)
        : [...new Set([...state.closed, group])]
      try {
        localStorage.setItem(storageKey, JSON.stringify(closed))
      } catch {
        return { closed }
      }
      return { closed }
    }),
}))
