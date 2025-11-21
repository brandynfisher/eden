'use client'

import { useAppShell } from '@/components/layout/app-shell'
import { PropsWithChildren, useEffect } from 'react'

const StudioLayout = ({ children }: PropsWithChildren) => {
  const { setConfig, resetConfig } = useAppShell()

  useEffect(() => {
    // Disable sidebar for Studio page - ConditionalHeader will show the navbar
    setConfig({
      showShell: false,
      sidebarVariant: 'sessions',
    })

    return () => resetConfig()
  }, [resetConfig, setConfig])

  return <>{children}</>
}

export default StudioLayout
