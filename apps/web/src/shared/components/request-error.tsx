import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { errorMessage } from "@/shared/api/api-error"

export function RequestError({
  error,
  fallback,
  notFound,
  retry,
}: {
  error: unknown
  fallback: string
  notFound?: string
  retry?: () => void
}) {
  return (
    <Alert variant="destructive" role="alert">
      <AlertDescription>
        <p>{errorMessage(error, fallback, notFound)}</p>
        {retry && (
          <Button variant="outline" className="mt-3 w-fit" onClick={retry}>
            Tentar novamente
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
