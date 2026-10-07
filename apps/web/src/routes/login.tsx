import { createFileRoute, redirect } from "@tanstack/react-router"
import { z } from "zod"
import { LoginPage } from "@/features/auth/components/login-page"
import { restoreSession } from "@/features/auth/api/auth-api"
import { errorMessage } from "@/shared/api/api-error"

export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    expired: z.coerce.number().optional().catch(undefined),
  }),
  beforeLoad: async () => {
    let authenticated: boolean
    try {
      authenticated = await restoreSession()
    } catch (error) {
      return {
        restoreError: errorMessage(
          error,
          "Não foi possível verificar sua sessão. Tente entrar novamente."
        ),
      }
    }
    if (authenticated) throw redirect({ to: "/" })
    return { restoreError: undefined }
  },
  component: Login,
})

function Login() {
  const { expired } = Route.useSearch()
  const { restoreError } = Route.useRouteContext()
  return <LoginPage expired={!!expired} restoreError={restoreError} />
}
