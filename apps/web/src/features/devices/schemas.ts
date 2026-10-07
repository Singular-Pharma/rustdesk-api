import { z } from "zod"
import { optionalText } from "@/shared/list/search"

export const deviceSearchSchema = z.object({
  q: optionalText,
  seen: z.enum(["online", "today", "stale"]).optional().catch(undefined),
})

export type DeviceSearch = z.infer<typeof deviceSearchSchema>

export const deviceFormSchema = z.object({
  id: z.string().trim().min(1, "Informe o ID do dispositivo"),
  alias: z.string().trim(),
  hostname: z.string().trim(),
  username: z.string().trim(),
  os: z.string().trim(),
  version: z.string().trim(),
  cpu: z.string().trim(),
  memory: z.string().trim(),
  uuid: z.string().trim(),
  groupId: z.string(),
})

export type DeviceFormValues = z.infer<typeof deviceFormSchema>
