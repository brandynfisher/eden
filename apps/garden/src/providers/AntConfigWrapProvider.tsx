import { ConfigProvider, theme as antdTheme } from 'antd'
import { useTheme } from 'next-themes'
import React, { ReactNode, useEffect, useState } from 'react'

const AntConfigWrapProvider = ({ children }: { children: ReactNode }) => {
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
    <ConfigProvider
      theme={{
        algorithm: isDarkMode
          ? [antdTheme.darkAlgorithm]
          : [antdTheme.defaultAlgorithm],
      }}
    >
      {children}
    </ConfigProvider>
  )
}

export default AntConfigWrapProvider
