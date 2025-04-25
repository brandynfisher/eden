import { FC, useEffect, useRef, useState } from 'react'

interface LegacyShutdownBannerProps {
  id: string // Unique identifier for each banner
  delay?: number // in milliseconds
  reappearAfterMinutes?: number // in minutes
}

const LegacyShutdownBanner: FC<LegacyShutdownBannerProps> = ({
  id,
  delay = 2000,
  reappearAfterMinutes = 5,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const REAPPEAR_INTERVAL = reappearAfterMinutes * 60 * 1000 // Convert minutes to milliseconds
  const DISMISS_KEY = `announcementDismissedAt_${id}`

  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISS_KEY)
    const now = Date.now()

    let shouldShow = true

    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10)
      if (now - dismissedTime < REAPPEAR_INTERVAL) {
        shouldShow = false
      }
    }

    if (shouldShow) {
      const timer = setTimeout(() => {
        setShouldRender(true)
        setTimeout(() => {
          setIsVisible(true)
        }, 50)
      }, delay)

      return () => clearTimeout(timer)
    }
  }, [delay, DISMISS_KEY, REAPPEAR_INTERVAL])

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
  }

  useEffect(() => {
    if (!isVisible && shouldRender) {
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [isVisible, shouldRender])

  useEffect(() => {
    if (isVisible && closeButtonRef.current) {
      closeButtonRef.current.focus()
    }
  }, [isVisible])

  if (!shouldRender) return null

  return (
    <>
      <div
        className={`announcement-banner h-auto py-3 lg:py-4 ml-0 w-full lg:w-[calc(100dvw_-_200px)] lg:ml-[200px] ${
          isVisible ? 'visible' : ''
        } bg-red-600/70 dark:bg-red-700/70 text-white`}
        aria-live="polite"
        role="alert"
      >
        <div className="banner-content flex items-center justify-between">
          <div className="flex items-center justify-center w-full">
            <span className="flex flex-col gap-2  items-center banner-text text-sm px-4  max-w-4xl">
              <div>
                <strong>⚠️ Important:</strong> This app will be discontinued on
                May 12.{' '}
              </div>
              <div>
                <a
                  href="https://beta.eden.art"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="banner-link underline font-semibold hover:text-white/90"
                >
                  Switch to our new app
                </a>{' '}
                — your credits and creation history are already there! Need
                help?{' '}
                <a
                  href="https://docs.eden.art/docs/guides/transition"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="banner-link underline font-semibold hover:text-white/90"
                >
                  Here's a guide!
                </a>
              </div>
            </span>
          </div>
          <button
            ref={closeButtonRef}
            className="banner-close text-lg font-bold focus:outline-none px-4 hover:text-white/90"
            onClick={handleClose}
            aria-label="Dismiss announcement"
          >
            ×
          </button>
        </div>
      </div>

      <style jsx>{`
        .announcement-banner {
          overflow: hidden;
          transform: translateY(-100%);
          opacity: 0;
          transition: transform 0.5s ease, opacity 0.5s ease;
        }

        .announcement-banner.visible {
          transform: translateY(0);
          opacity: 1;
        }

        .banner-content {
          display: flex;
          align-items: center;
          margin: 0 auto;
        }

        .banner-text {
          line-height: 1.5;
        }

        .banner-link {
          color: inherit;
        }

        .banner-close {
          background: transparent;
          border: none;
          color: inherit;
          cursor: pointer;
          line-height: 1;
        }

        @media (max-width: 1024px) {
          .banner-content {
            padding: 0 16px;
          }
        }
      `}</style>
    </>
  )
}

export default LegacyShutdownBanner
