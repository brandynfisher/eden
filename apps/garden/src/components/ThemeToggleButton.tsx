import { useTheme } from 'next-themes'
import { UseThemeProps } from 'next-themes/dist/types'
import { useCallback, useEffect, useState } from 'react'

const toggleTheme = (theme: UseThemeProps['theme']): 'light' | 'dark' => {
  return theme === 'dark' ? 'light' : 'dark'
}

const ThemeToggleButton = () => {
  const [mounted, setMounted] = useState(false)
  const { theme, resolvedTheme, setTheme } = useTheme()

  const handleThemeToggleClick = useCallback(() => {
    setTheme(toggleTheme(resolvedTheme))
  }, [resolvedTheme, setTheme])

  // prevent hydration mismatch errors - useEffect is only run client-side
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div onClick={handleThemeToggleClick}>
      Theme: {resolvedTheme} {theme === 'system' ? '(system)' : ''}
    </div>
  )
}

export default ThemeToggleButton
