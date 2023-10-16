import { ThemeProvider, createTheme } from '@mui/material/styles'
import { useTheme } from 'next-themes'
import { ReactNode, useEffect, useState } from 'react'

interface PageProviderProps {
  children: ReactNode
}

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
})

const lightTheme = createTheme({
  palette: {
    mode: 'light',
  },
})

const MUIConfigWrapProvider = ({ children }: PageProviderProps) => {
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
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      {children}
    </ThemeProvider>
  )
}

export default MUIConfigWrapProvider
