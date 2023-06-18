import { ThemeProvider } from 'next-themes'
import React, { ReactNode } from 'react'

interface PageProviderProps {
  children: ReactNode
}

const PageProvider = ({ children }: PageProviderProps) => {
  return (
    <ThemeProvider themes={['light', 'dark']} attribute="class">
      {children}
    </ThemeProvider>
  )
}

export default PageProvider
