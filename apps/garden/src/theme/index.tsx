import { ConfigProvider, theme as antdTheme } from 'antd'
import React from 'react'

const withTheme = (node: JSX.Element) => {
  return (
    <>
      <ConfigProvider
        theme={{
          algorithm: [antdTheme.darkAlgorithm],
        }}
      >
        {node}
      </ConfigProvider>
      <ConfigProvider
        theme={{
          algorithm: [antdTheme.defaultAlgorithm],
        }}
      >
        {node}
      </ConfigProvider>
    </>
  )
}
export default withTheme
