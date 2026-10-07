import { z } from "zod"

export const optionalText = z.string().optional().catch(undefined)
export const optionalId = z.coerce
  .number()
  .int()
  .positive()
  .optional()
  .catch(undefined)

export const textSearchSchema = z.object({ q: optionalText })

export function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
}

export function matchesQuery(text: string, query?: string) {
  return normalized(text).includes(normalized(query?.trim() ?? ""))
}
