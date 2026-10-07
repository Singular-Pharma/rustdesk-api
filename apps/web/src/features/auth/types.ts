import { z } from "zod"

export const sessionSchema = z.object({ token: z.string().min(1) })

export const principalSchema = z.object({
  username: z.string(),
  email: z.string(),
  nickname: z.string(),
  route_names: z.array(z.string()).nullish(),
})

export type Session = z.infer<typeof sessionSchema>
export type Principal = z.infer<typeof principalSchema>

export function isAdmin(principal: Principal | null) {
  return !!principal?.route_names?.includes("*")
}

export function displayName(principal: Principal | null) {
  return principal?.nickname || principal?.username || ""
}
