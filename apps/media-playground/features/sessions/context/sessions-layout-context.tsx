import { createContext, useContext } from 'react'

type SessionsLayoutContextValue = {
  forceHideSidebar: boolean
  setForceHideSidebar: (value: boolean) => void
}

export const SessionsLayoutContext =
  createContext<SessionsLayoutContextValue | null>(null)

export const useSessionsLayoutContext = () => {
  return useContext(SessionsLayoutContext)
}
