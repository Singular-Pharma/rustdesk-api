import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { adminResource } from "@/shared/api/resource"
import { everyRecord, serverDate } from "@/shared/api/pages"
import { postData } from "@/shared/api/http-client"

export const enabledStatus = 1
export const disabledStatus = 2

const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  nickname: z.string(),
  group_id: z.number(),
  is_admin: z.boolean().nullish(),
  status: z.number(),
  remark: z.string(),
  created_at: serverDate,
  updated_at: serverDate,
})

export type User = z.infer<typeof userSchema>

export type UserInput = {
  username: string
  email: string
  nickname: string
  group_id: number
  is_admin: boolean
  status: number
  remark: string
}

const users = adminResource("/user", userSchema)

export const usersKey = ["users"] as const

export function useUsers() {
  return useQuery({
    queryKey: usersKey,
    queryFn: ({ signal }) => users.list({ page_size: everyRecord }, signal),
    select: (page) => page.list,
  })
}

export function useUser(id: number) {
  return useQuery({
    queryKey: [...usersKey, id],
    queryFn: ({ signal }) => users.detail(id, signal),
  })
}

export function useUserNames() {
  const list = useUsers()
  const byId = new Map(list.data?.map((user) => [user.id, user]))
  return {
    name: (id: number) => {
      const user = byId.get(id)
      return user ? user.nickname || user.username : undefined
    },
    options: (list.data ?? []).map((user) => ({
      value: String(user.id),
      label: user.nickname
        ? `${user.nickname} (${user.username})`
        : user.username,
    })),
  }
}

export function userLabel(user: User) {
  return user.nickname || user.username
}

export async function setPassword(id: number, password: string) {
  await postData("/user/changePwd", { id, password })
}

async function findCreatedUserId(username: string) {
  const page = await users.list({ username, page_size: everyRecord })
  const created = page.list.find(
    (user) => user.username.toLowerCase() === username.toLowerCase()
  )
  if (!created) throw new Error("Created user not found")
  return created.id
}

export class PasswordNotSetError extends Error {
  readonly userId: number | undefined

  constructor(userId: number | undefined) {
    super("User created without password")
    this.userId = userId
  }
}

export async function createUser(user: UserInput, password: string) {
  await users.create(user)
  let id: number | undefined
  try {
    id = await findCreatedUserId(user.username)
    await setPassword(id, password)
  } catch {
    throw new PasswordNotSetError(id)
  }
  return id
}

export async function updateUser(id: number, user: UserInput) {
  await users.update({ id, ...user })
}

export async function removeUser(id: number) {
  await users.remove({ id })
}
