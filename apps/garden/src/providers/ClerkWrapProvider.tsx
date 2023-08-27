import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useTheme } from 'next-themes'
import React, { ReactNode, useEffect, useState } from 'react'

const ClerkWrapProvider = ({ children }: { children: ReactNode }) => {
  const { resolvedTheme } = useTheme()
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    if (resolvedTheme && resolvedTheme === 'dark') {
      setIsDarkMode(true)
    } else {
      setIsDarkMode(false)
    }
  }, [resolvedTheme])

  return (
    <ClerkProvider appearance={isDarkMode ? { baseTheme: dark } : undefined}>
      {children}
    </ClerkProvider>
  )
}

export default ClerkWrapProvider
