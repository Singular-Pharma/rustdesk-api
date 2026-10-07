import { createFileRoute, redirect } from "@tanstack/react-router"
import { AppShell } from "@/components/layout/app-shell"
import { restoreSession } from "@/features/auth/api/auth-api"
import { useAuthStore } from "@/stores/auth-store"

function toLogin() {
  return redirect({
    to: "/login",
    search: { expired: useAuthStore.getState().expired ? 1 : undefined },
  })
}

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const authenticated = await restoreSession().catch(() => false)
    if (!authenticated) throw toLogin()
  },
  component: AppShell,
})
