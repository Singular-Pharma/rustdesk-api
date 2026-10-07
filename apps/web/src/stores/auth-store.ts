import { create } from "zustand"
import {
  sessionSchema,
  type Principal,
  type Session,
} from "@/features/auth/types"

const storageKey = "remoto.session"

function readSession(): Session | null {
  try {
    const saved = sessionStorage.getItem(storageKey)
    if (!saved) return null
    const parsed = sessionSchema.safeParse(JSON.parse(saved))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

function persistSession(session: Session | null) {
  try {
    if (session) sessionStorage.setItem(storageKey, JSON.stringify(session))
    else sessionStorage.removeItem(storageKey)
  } catch {
    return
  }
}

type AuthState = {
  session: Session | null
  principal: Principal | null
  expired: boolean
  setSession: (session: Session, principal: Principal) => void
  setPrincipal: (principal: Principal) => void
  clearSession: (expired?: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: readSession(),
  principal: null,
  expired: false,
  setSession: (session, principal) => {
    persistSession(session)
    set({ session, principal, expired: false })
  },
  setPrincipal: (principal) => set({ principal }),
  clearSession: (expired = false) => {
    persistSession(null)
    set({ session: null, principal: null, expired })
  },
}))
