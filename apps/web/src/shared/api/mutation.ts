import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/auth-store"

export function useAdminMutation<TInput, TResult = unknown>(
  run: (input: TInput) => Promise<TResult>,
  invalidates: readonly (readonly unknown[])[]
) {
  const client = useQueryClient()
  const token = useAuthStore((state) => state.session?.token)
  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      if (useAuthStore.getState().session?.token !== token) return
      for (const queryKey of invalidates)
        void client.invalidateQueries({ queryKey })
    },
  })
}
