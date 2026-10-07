import { z } from "zod"
import { optionalText } from "@/shared/list/search"

export const userSearchSchema = z.object({
  q: optionalText,
  role: z.enum(["admin", "member"]).optional().catch(undefined),
  status: z.enum(["enabled", "disabled"]).optional().catch(undefined),
})

export type UserSearch = z.infer<typeof userSearchSchema>

export const passwordSchema = z
  .string()
  .min(4, "Use uma senha com pelo menos 4 caracteres")
  .max(32, "Use uma senha com até 32 caracteres")

export const userFormSchema = z.object({
  username: z
    .string()
    .transform((value) => value.replace(/\s/g, "").toLowerCase())
    .pipe(
      z
        .string()
        .min(2, "Use pelo menos 2 caracteres")
        .max(32, "Use até 32 caracteres")
    ),
  email: z.union([z.literal(""), z.email("Informe um e-mail válido")]),
  nickname: z.string().trim(),
  groupId: z.string().min(1, "Selecione o grupo"),
  isAdmin: z.boolean(),
  enabled: z.boolean(),
  remark: z.string().trim(),
  password: z.string(),
})

export const createUserSchema = userFormSchema.extend({
  password: passwordSchema,
})

export type UserFormInput = z.input<typeof userFormSchema>
export type UserFormValues = z.output<typeof userFormSchema>
