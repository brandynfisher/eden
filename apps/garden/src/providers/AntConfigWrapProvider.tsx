import { App, ConfigProvider, theme as antdTheme } from 'antd'
import { useTheme } from 'next-themes'
import React, { ReactNode, useEffect, useState } from 'react'

const AntConfigWrapProvider = ({ children }: { children: ReactNode }) => {
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
    <ConfigProvider
      theme={{
        algorithm: isDarkMode
          ? [antdTheme.darkAlgorithm]
          : [antdTheme.defaultAlgorithm],
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  )
}

export default AntConfigWrapProvider
