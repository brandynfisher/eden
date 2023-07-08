import { useTheme } from 'next-themes'
import { Highlight, themes } from 'prism-react-renderer'
import { useEffect, useState } from 'react'

const CodeBlock = ({ code, language }: { code: string; language: string }) => {
  const { resolvedTheme } = useTheme()
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    if (resolvedTheme && resolvedTheme === 'dark') {
      setIsDarkMode(true)
    } else {
      setIsDarkMode(false)
    }
  }, [resolvedTheme])

  return (
    <div className="rounded-lg overflow-hidden">
      <Highlight
        theme={isDarkMode ? themes.vsDark : themes.github}
        code={code}
        language={language}
      >
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre style={style} className="p-4 mb-2">
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  )
}

export default CodeBlock
