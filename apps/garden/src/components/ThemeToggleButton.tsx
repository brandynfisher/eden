import { Space, Switch } from 'antd'
import { useTheme } from 'next-themes'
import { UseThemeProps } from 'next-themes/dist/types'
import { useCallback, useEffect, useState } from 'react'

const toggleTheme = (theme: UseThemeProps['theme']): 'light' | 'dark' => {
  return theme === 'dark' ? 'light' : 'dark'
}

const ThemeToggleButton = () => {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

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
    <Space>
      <div className="text-black dark:text-white">Dark Mode</div>
      <Switch
        onClick={handleThemeToggleClick}
        checked={resolvedTheme === 'dark'}
      />
    </Space>
  )
}

export default ThemeToggleButton
