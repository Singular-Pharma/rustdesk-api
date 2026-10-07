import { createRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"
import { queryClient } from "@/shared/api/query-client"
import { useAuthStore } from "@/stores/auth-store"

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultPendingMs: 200,
})

useAuthStore.subscribe((current, previous) => {
  if (current.session?.token === previous.session?.token) return
  queryClient.clear()
  if (!current.session && previous.session) {
    void router.navigate({
      to: "/login",
      search: { expired: current.expired ? 1 : undefined },
      replace: true,
      ignoreBlocker: true,
    })
  }
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
