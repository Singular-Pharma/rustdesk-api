const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
})

const serverDateTimePattern = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/

export function formatServerDateTime(value: string, empty = "") {
  const match = serverDateTimePattern.exec(value)
  if (!match || match[1] === "0001") return empty
  const [, year, month, day, hour, minute] = match
  return `${day}/${month}/${year} ${hour}:${minute}`
}

export function formatUnixTime(seconds: number, empty = "") {
  return seconds > 0 ? dateTime.format(new Date(seconds * 1000)) : empty
}

const relative = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" })

const relativeSteps: [
  limit: number,
  seconds: number,
  unit: Intl.RelativeTimeFormatUnit,
][] = [
  [60, 1, "second"],
  [3600, 60, "minute"],
  [86_400, 3600, "hour"],
  [2_592_000, 86_400, "day"],
  [31_536_000, 2_592_000, "month"],
  [Infinity, 31_536_000, "year"],
]

export function formatSince(seconds: number, now = Date.now()) {
  if (seconds <= 0) return ""
  const elapsed = Math.max(0, Math.round(now / 1000 - seconds))
  const [, size, unit] =
    relativeSteps.find(([limit]) => elapsed < limit) ?? relativeSteps.at(-1)!
  return relative.format(-Math.floor(elapsed / size), unit)
}

export const onlineWindowSeconds = 60

export function isOnline(lastOnline: number, now = Date.now()) {
  return lastOnline > 0 && now / 1000 - lastOnline < onlineWindowSeconds
}

const serverSecondsPattern =
  /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/

export function serverDateToUnix(value: string) {
  const match = serverSecondsPattern.exec(value)
  if (!match || match[1] === "0001") return 0
  const [year, month, day, hour, minute, second] = match
    .slice(1)
    .map((part) => Number(part ?? 0))
  return new Date(year!, month! - 1, day, hour, minute, second).getTime() / 1000
}

export function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))} s`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}

const sizeUnits = ["B", "KB", "MB", "GB", "TB"]

export function formatBytes(bytes: number) {
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < sizeUnits.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size.toLocaleString("pt-BR", { maximumFractionDigits: unit ? 1 : 0 })} ${sizeUnits[unit]}`
}
