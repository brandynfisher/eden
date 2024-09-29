import { FC, ReactNode, useEffect, useRef, useState } from 'react'

interface AnnouncementBannerProps {
  id: string // Unique identifier for each banner
  text: ReactNode
  linkUrl?: string
  linkText?: string
  delay?: number // in milliseconds
  reappearAfter?: number // in hours
}

const AnnouncementBanner: FC<AnnouncementBannerProps> = ({
  id,
  text,
  linkUrl,
  linkText,
  delay = 2000,
  reappearAfter = 48,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const REAPPEAR_INTERVAL = reappearAfter * 60 * 60 * 1000 // Convert hours to milliseconds
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
        // Apply 'visible' class in the next tick to trigger CSS transition
        setTimeout(() => {
          setIsVisible(true)
        }, 50) // 50ms delay to ensure the initial render has applied 'hidden' state
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
      }, 500) // Duration should match the CSS transition duration

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
        className={`announcement-banner h-9 lg:h-16 ml-auto lg:w-[calc(100dvw_-_200px)] lg:ml-[200px] ${
          isVisible ? 'visible' : ''
        } bg-purple-600 dark:bg-purple-800 text-gray-800 dark:text-gray-300`}
        aria-live="polite"
        role="alert"
      >
        <div className="banner-content flex items-center justify-between">
          <div className="flex items-center justify-center w-full">
            <span className="banner-text text-sm flex items-center justify-center w-full">
              <div className="flex items-center">
                {text}{' '}
                {linkUrl && linkText && (
                  <a
                    href={linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="banner-link underline ml-2"
                  >
                    {linkText}
                  </a>
                )}
              </div>
            </span>
          </div>
          <button
            ref={closeButtonRef}
            className="banner-close text-lg font-bold focus:outline-none"
            onClick={handleClose}
            aria-label="Dismiss announcement"
          >
            &times;
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
          justify-content: space-between;
          padding: 12px 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .banner-icon {
          display: flex;
          align-items: center;
        }

        .banner-text {
          flex: 1;
          font-size: 16px;
        }

        .banner-link {
          color: inherit;
          text-decoration: underline;
        }

        .banner-close {
          background: transparent;
          border: none;
          color: inherit;
          font-size: 20px;
          cursor: pointer;
          padding: 0 8px;
          line-height: 1;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .banner-content {
            align-items: flex-start;
            padding: 8px 16px;
            font-size: 16px;
          }

          .banner-text {
            font-size: 14px;
          }

          .banner-close {
            align-self: flex-end;
          }
        }
      `}</style>
    </>
  )
}

export default AnnouncementBanner
