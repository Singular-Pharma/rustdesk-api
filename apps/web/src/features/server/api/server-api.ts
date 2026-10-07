import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { getData, postData } from "@/shared/api/http-client"
import { pageSchema } from "@/shared/api/pages"

export const serverTargets = { id: "21115", relay: "21117" } as const

export type ServerTarget = (typeof serverTargets)[keyof typeof serverTargets]

export const targetOptions = [
  { value: serverTargets.id, label: "Servidor de ID" },
  { value: serverTargets.relay, label: "Servidor de relay" },
]

export function targetLabel(target: string) {
  return (
    targetOptions.find((option) => option.value === target)?.label ?? target
  )
}

const commandSchema = z.object({
  id: z.number().optional().catch(undefined),
  cmd: z.string(),
  alias: z.string().catch(""),
  option: z.string().catch(""),
  explain: z.string().catch(""),
  target: z.string(),
})

export type Command = z.infer<typeof commandSchema>
export type CommandInput = Omit<Command, "id">

export const commandsKey = ["server", "commands"] as const
export const serverStateKey = ["server", "state"] as const

const allCommands = 9999

export function useCommands() {
  return useQuery({
    queryKey: commandsKey,
    queryFn: ({ signal }) =>
      getData(
        "/rustdesk/cmdList",
        pageSchema(commandSchema),
        { page_size: allCommands },
        signal
      ),
    select: (page) => page.list,
  })
}

export async function sendCommand(target: string, cmd: string, option = "") {
  const reply = await postData("/rustdesk/sendCmd", { target, cmd, option })
  return typeof reply === "string" ? reply : ""
}

export function saveCommand(command: CommandInput, id?: number) {
  return id
    ? postData("/rustdesk/cmdUpdate", { id, ...command })
    : postData("/rustdesk/cmdCreate", command)
}

export function removeCommand(id: number) {
  return postData("/rustdesk/cmdDelete", { id })
}

export function replyLines(reply: string) {
  return reply
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

export function useServerReply(
  target: ServerTarget,
  cmd: string,
  enabled = true
) {
  return useQuery({
    queryKey: [...serverStateKey, target, cmd],
    queryFn: () => sendCommand(target, cmd),
    enabled,
  })
}

export function useServerAvailability(target: ServerTarget) {
  const help = useServerReply(target, "h")
  return {
    ...help,
    available: help.isSuccess && !!help.data.trim(),
    supports: (command: string) => !!help.data?.includes(command),
  }
}
