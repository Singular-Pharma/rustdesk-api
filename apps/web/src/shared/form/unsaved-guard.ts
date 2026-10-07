import { useBlocker } from "@tanstack/react-router"
import { useAuthStore } from "@/stores/auth-store"

export function useUnsavedGuard(dirty: boolean, saved: { current: boolean }) {
  const pending = () =>
    !!useAuthStore.getState().session && dirty && !saved.current
  useBlocker({
    shouldBlockFn: () =>
      pending() &&
      !window.confirm("Descartar as alterações que ainda não foram salvas?"),
    enableBeforeUnload: pending,
  })
}
