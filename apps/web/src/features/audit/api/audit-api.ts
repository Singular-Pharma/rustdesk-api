import { z } from "zod"
import { postData } from "@/shared/api/http-client"
import { fetchPage, serverDate } from "@/shared/api/pages"

const connectionSchema = z.object({
  id: z.number(),
  action: z.string(),
  peer_id: z.string(),
  from_peer: z.string(),
  from_name: z.string(),
  ip: z.string(),
  type: z.number(),
  close_time: z.number(),
  created_at: serverDate,
})

const transferredFilesSchema = z.string().transform((info) => {
  try {
    return z
      .object({ files: z.array(z.tuple([z.string(), z.number()])) })
      .parse(JSON.parse(info)).files
  } catch {
    return []
  }
})

const fileTransferSchema = z.object({
  id: z.number(),
  peer_id: z.string(),
  from_peer: z.string(),
  from_name: z.string(),
  ip: z.string(),
  type: z.number(),
  is_file: z.boolean(),
  path: z.string(),
  num: z.number(),
  info: transferredFilesSchema,
  created_at: serverDate,
})

const loginSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  client: z.string(),
  device_id: z.string(),
  ip: z.string(),
  type: z.string(),
  platform: z.string(),
  created_at: serverDate,
})

const sessionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  device_id: z.string(),
  device_uuid: z.string(),
  expired_at: z.number(),
  created_at: serverDate,
})

const shareSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  peer_id: z.string(),
  password_type: z.string(),
  expire: z.number(),
  created_at: serverDate,
})

export type Connection = z.infer<typeof connectionSchema>
export type FileTransfer = z.infer<typeof fileTransferSchema>
export type Login = z.infer<typeof loginSchema>
export type Session = z.infer<typeof sessionSchema>
export type Share = z.infer<typeof shareSchema>

export type LogResource<T> = {
  key: readonly unknown[]
  list: (
    params: Record<string, unknown>,
    signal?: AbortSignal
  ) => ReturnType<typeof fetchPage<T>>
  remove: (id: number) => Promise<unknown>
  removeMany: (ids: number[]) => Promise<unknown>
}

function logResource<T>(
  path: string,
  item: z.ZodType<T>,
  key: string
): LogResource<T> {
  return {
    key: ["audit", key],
    list: (params, signal) => fetchPage(`${path}/list`, item, params, signal),
    remove: (id) => postData(`${path}/delete`, { id }),
    removeMany: (ids) => postData(`${path}/batchDelete`, { ids }),
  }
}

export const connections = logResource(
  "/audit_conn",
  connectionSchema,
  "connections"
)
export const fileTransfers = logResource(
  "/audit_file",
  fileTransferSchema,
  "files"
)
export const logins = logResource("/login_log", loginSchema, "logins")
export const sessions = logResource("/user_token", sessionSchema, "sessions")
export const shares = logResource("/share_record", shareSchema, "shares")

export const fileTransferToRemote = 1

export const fileTransferConnection = 1

export function connectionKind(connection: Connection) {
  return connection.type === fileTransferConnection
    ? "Transferência de arquivos"
    : "Controle remoto"
}
