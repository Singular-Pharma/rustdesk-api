import { create } from "zustand"

type Theme = "light" | "dark"

function readTheme(): Theme {
  try {
    return localStorage.getItem("remoto.theme") === "dark" ? "dark" : "light"
  } catch {
    return "light"
  }
}

export const useThemeStore = create<{ theme: Theme; toggle: () => void }>(
  (set) => ({
    theme: readTheme(),
    toggle: () =>
      set((state) => {
        const theme = state.theme === "dark" ? "light" : "dark"
        try {
          localStorage.setItem("remoto.theme", theme)
        } catch {
          return { theme }
        }
        return { theme }
      }),
  })
)
