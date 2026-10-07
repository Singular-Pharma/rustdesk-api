import { useEffect, useRef, useState } from "react"

export function useStuckToBottom() {
  const bar = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const element = bar.current
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!!entry && entry.intersectionRatio < 1),
      { threshold: [1], rootMargin: "0px 0px -1px 0px" }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { bar, stuck }
}
