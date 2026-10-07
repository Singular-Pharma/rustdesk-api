import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"

export function UserAvatar({ name }: { name: string }) {
  const words = name.trim().split(/\s+/)
  const initials = `${words[0]?.[0] ?? ""}${words.length > 1 ? (words.at(-1)?.[0] ?? "") : ""}`
  return (
    <Avatar aria-hidden="true">
      <AvatarFallback>{initials.toLocaleUpperCase("pt-BR")}</AvatarFallback>
    </Avatar>
  )
}
