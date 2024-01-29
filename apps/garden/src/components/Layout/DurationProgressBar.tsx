import { useEffect, useState } from 'react'

const DurationProgressBar = ({ duration }: { duration: number }) => {
  const [started, setStarted] = useState(false)
  const [transitionDuration, setTransitionDuration] = useState<
    string | undefined
  >()

  useEffect(() => {
    setTransitionDuration(`${duration / 1000}s`)
  }, [duration])

  useEffect(() => {
    if (transitionDuration) {
      setStarted(true)
    }
  }, [transitionDuration])

  return (
    <div className="relative h-1 w-full bg-gray-700">
      {transitionDuration ? (
        <div
          className={`absolute bg-blue-600 h-full w-0 transition-all ${
            started ? '!w-full' : ''
          }`}
          style={{
            transitionDuration: transitionDuration,
            transitionTimingFunction: 'linear',
          }}
        />
      ) : null}
    </div>
  )
}

export default DurationProgressBar
