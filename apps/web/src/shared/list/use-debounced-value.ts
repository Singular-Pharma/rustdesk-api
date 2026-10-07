import { useEffect, useState } from "react"

const typingPauseMs = 300

export function useDebouncedValue<T>(value: T) {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), typingPauseMs)
    return () => clearTimeout(timer)
  }, [value])
  return settled
}
