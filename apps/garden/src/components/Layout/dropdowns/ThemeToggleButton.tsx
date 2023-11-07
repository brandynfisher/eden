import { Space, Switch } from 'antd'
import { useTheme } from 'next-themes'
import { UseThemeProps } from 'next-themes/dist/types'
import React, { useCallback, useEffect, useState } from 'react'

const toggleTheme = (theme: UseThemeProps['theme']): 'light' | 'dark' => {
  return theme === 'dark' ? 'light' : 'dark'
}

const ThemeToggleButton = () => {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  const handleThemeToggleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.stopPropagation()
      setTheme(toggleTheme(resolvedTheme))
    },
    [resolvedTheme, setTheme],
  )

  // prevent hydration mismatch errors - useEffect is only run client-side
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Space
      onClick={handleThemeToggleClick}
      className="justify-between w-full p-2"
    >
      <div className="flex">
        <div>☾ </div>
        <div className="font-mono ml-2 text-black dark:text-white">
          Dark Mode
        </div>
      </div>
      <Switch checked={resolvedTheme === 'dark'} />
    </Space>
  )
}

export default ThemeToggleButton
