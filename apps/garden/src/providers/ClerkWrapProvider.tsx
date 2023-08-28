import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useTheme } from 'next-themes'
import React, { ReactNode, useEffect, useState } from 'react'

const ClerkWrapProvider = ({ children }: { children: ReactNode }) => {
  const { resolvedTheme } = useTheme()
  const [baseTheme, setBaseTheme] = useState<typeof dark | undefined>(dark)

  useEffect(() => {
    if (resolvedTheme && resolvedTheme === 'dark') {
      setBaseTheme(dark)
    } else {
      setBaseTheme(undefined)
    }
  }, [resolvedTheme])

  return <ClerkProvider appearance={{ baseTheme }}>{children}</ClerkProvider>
}

export default ClerkWrapProvider
