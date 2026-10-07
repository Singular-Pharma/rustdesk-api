import { z } from "zod"
import { getData, httpClient, postData } from "@/shared/api/http-client"
import { useAuthStore } from "@/stores/auth-store"
import { principalSchema } from "../types"

const loginOptionsSchema = z.object({
  need_captcha: z.boolean(),
  disable_pwd: z.boolean(),
})

const captchaSchema = z.object({
  captcha: z.object({ id: z.string(), b64: z.string() }),
})

const loginReplySchema = principalSchema.extend({ token: z.string().min(1) })

export type Credentials = {
  username: string
  password: string
  captcha?: { id: string; answer: string }
}

function browserPlatform() {
  const agent = navigator.userAgent
  if (/android/i.test(agent)) return "android"
  if (/iphone|ipad/i.test(agent)) return "ios"
  if (/mac/i.test(agent)) return "mac"
  if (/win/i.test(agent)) return "windows"
  if (/linux/i.test(agent)) return "linux"
  return "web"
}

export function fetchLoginOptions(signal?: AbortSignal) {
  return getData("/login-options", loginOptionsSchema, undefined, signal)
}

export async function fetchCaptcha() {
  return (await getData("/captcha", captchaSchema)).captcha
}

export async function login({ username, password, captcha }: Credentials) {
  const reply = loginReplySchema.parse(
    await postData("/login", {
      username,
      password,
      platform: browserPlatform(),
      captcha_id: captcha?.id,
      captcha: captcha?.answer,
    })
  )
  const { token, ...principal } = reply
  useAuthStore.getState().setSession({ token }, principal)
  return principal
}

let restoring: { token: string; promise: Promise<boolean> } | null = null

export async function restoreSession(): Promise<boolean> {
  const auth = useAuthStore.getState()
  if (!auth.session) return false
  if (auth.principal) return true
  const token = auth.session.token
  if (restoring?.token === token) return restoring.promise
  const promise = getData("/user/current", principalSchema)
    .then((principal) => {
      const current = useAuthStore.getState()
      if (current.session?.token !== token) return false
      current.setPrincipal(principal)
      return true
    })
    .catch((error: unknown) => {
      if (!useAuthStore.getState().session) return false
      throw error
    })
    .finally(() => {
      if (restoring?.promise === promise) restoring = null
    })
  restoring = { token, promise }
  return promise
}

export async function logout() {
  if (useAuthStore.getState().session) {
    await httpClient.post("/logout").catch(() => undefined)
  }
  useAuthStore.getState().clearSession()
}
