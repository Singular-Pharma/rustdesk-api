import axios, { type InternalAxiosRequestConfig } from "axios"
import { z } from "zod"
import { useAuthStore } from "@/stores/auth-store"
import { ApiError, isLoginRequired } from "./api-error"

const envelopeSchema = z.object({
  code: z.number(),
  message: z.string().catch(""),
  data: z.unknown(),
})

export const httpClient = axios.create({
  baseURL: "/api/admin",
  timeout: 30_000,
  headers: { "Accept-Language": "en" },
})

httpClient.interceptors.request.use((request) => {
  const token = useAuthStore.getState().session?.token
  if (token && !request.headers.has("api-token"))
    request.headers.set("api-token", token)
  return request
})

function endSessionIfStillCurrent(
  config: InternalAxiosRequestConfig | undefined
) {
  const auth = useAuthStore.getState()
  const usedToken = config?.headers.get("api-token")
  if (auth.session && usedToken === auth.session.token) auth.clearSession(true)
}

httpClient.interceptors.response.use(
  (response) => {
    const envelope = envelopeSchema.safeParse(response.data)
    if (!envelope.success) throw new ApiError(-1, "Unexpected response")
    if (envelope.data.code === 0) {
      response.data = envelope.data.data
      return response
    }
    const error = new ApiError(envelope.data.code, envelope.data.message)
    if (isLoginRequired(error)) endSessionIfStillCurrent(response.config)
    throw error
  },
  (error: unknown) => {
    if (axios.isAxiosError(error) && isLoginRequired(error))
      endSessionIfStillCurrent(error.config)
    return Promise.reject(error)
  }
)

export async function getData<T>(
  url: string,
  schema: z.ZodType<T>,
  params?: Record<string, unknown>,
  signal?: AbortSignal
) {
  const { data } = await httpClient.get(url, { params, signal })
  return schema.parse(data)
}

export async function postData(url: string, body?: unknown) {
  const { data } = await httpClient.post(url, body)
  return data as unknown
}
