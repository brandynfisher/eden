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
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    if (resolvedTheme && resolvedTheme === 'light') {
      setIsDarkMode(false)
    } else {
      setIsDarkMode(true)
    }
  }, [resolvedTheme])

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      {children}
    </ThemeProvider>
  )
}

export default MUIConfigWrapProvider
