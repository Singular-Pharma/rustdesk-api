import { useEffect, useRef, useState } from "react"

const waitBeforeShowingMs = 200
const shortestVisibleMs = 400

export function useDelayedVisibility(waiting: boolean) {
  const [visible, setVisible] = useState(false)
  const shownAt = useRef(0)

  useEffect(() => {
    if (waiting) {
      const timer = setTimeout(() => {
        shownAt.current = Date.now()
        setVisible(true)
      }, waitBeforeShowingMs)
      return () => clearTimeout(timer)
    }
    const remaining = shortestVisibleMs - (Date.now() - shownAt.current)
    const timer = setTimeout(() => setVisible(false), Math.max(0, remaining))
    return () => clearTimeout(timer)
  }, [waiting])

  return { visible, holding: visible || waiting }
}
