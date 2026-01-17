import { createContext, useContext } from 'react'

type ArtifactControls = {
  count: number
  label: string
  isOpen?: boolean
  onToggle?: () => void
}

type SessionsLayoutContextValue = {
  forceHideSidebar: boolean
  setForceHideSidebar: (value: boolean) => void
  openSidebar?: () => void
  artifactControls?: ArtifactControls
  setArtifactControls?: (controls: ArtifactControls) => void
}

export const SessionsLayoutContext =
  createContext<SessionsLayoutContextValue | null>(null)

export const useSessionsLayoutContext = () => {
  return useContext(SessionsLayoutContext)
}
