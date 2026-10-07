import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router"
import type { QueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: Outlet,
    pendingComponent: () => (
      <p
        role="status"
        className="flex min-h-svh items-center justify-center gap-2 text-sm text-muted-foreground"
      >
        <Spinner />
        Carregando…
      </p>
    ),
    errorComponent: ({ reset }) => (
      <div
        role="alert"
        className="flex min-h-svh flex-col items-center justify-center gap-4"
      >
        <p>Não foi possível abrir esta página.</p>
        <Button onClick={reset}>Tentar novamente</Button>
      </div>
    ),
    notFoundComponent: () => (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-medium">Página não encontrada</h1>
        <Button render={<Link to="/" />} nativeButton={false} role="link">
          Ir para o início
        </Button>
      </div>
    ),
  }
)
