'use client'

import { useEffect, useState } from 'react'

interface FlippingTextProps {
  baseText: string
  words: string[]
  interval?: number
  className?: string
}

export default function FlippingText({
  baseText,
  words,
  interval = 2000,
  className = '',
}: FlippingTextProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setIsFlipping(true)

      setTimeout(() => {
        setCurrentWordIndex(prevIndex => (prevIndex + 1) % words.length)
        setIsFlipping(false)
      }, 600)
    }, interval)

    return () => clearInterval(timer)
  }, [words.length, interval])

  const parts = baseText.split(' ')
  const lastWordIndex = parts.length - 1
  const beforeLastWord = parts.slice(0, lastWordIndex).join(' ')

  return (
    <div className={className}>
      <div className="mb-2">{beforeLastWord}</div>
      <div className="relative inline-block">
        <div
          className={`transition-all duration-500 ease-in-out ${
            isFlipping
              ? 'transform -translate-y-2 opacity-0'
              : 'transform translate-y-0 opacity-100'
          }`}
          style={{
            minWidth: '200px',
            display: 'inline-block',
            textAlign: 'center',
          }}
        >
          <span className="text-yellow-400">{words[currentWordIndex]}</span>
        </div>
      </div>
    </div>
  )
}
