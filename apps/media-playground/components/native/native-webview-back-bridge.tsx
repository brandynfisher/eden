'use client'

import { useNativeWebview } from '@/hooks/use-native-webview'
import { useEffect, useRef } from 'react'

const OPEN_OVERLAY_SELECTOR = [
  '[data-state="open"][role="dialog"]',
  '[data-state="open"][data-radix-dialog-content]',
  '[data-state="open"][data-radix-popover-content]',
  '[data-state="open"][data-radix-menu-content]',
  '[data-state="open"][data-radix-select-content]',
  '[data-state="open"][data-radix-tooltip-content]',
].join(',')

const getOpenOverlayCount = () => {
  if (typeof document === 'undefined') return 0
  return document.querySelectorAll(OPEN_OVERLAY_SELECTOR).length
}

const notifyNativeModalState = (openCount: number) => {
  if (typeof window === 'undefined') return
  window.ReactNativeWebView?.postMessage(
    JSON.stringify({
      type: 'NATIVE_MODAL_STATE',
      open: openCount > 0,
      openCount,
    }),
  )
}

export default function NativeWebviewBackBridge() {
  const isNativeWebview = useNativeWebview()
  const lastCountRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isNativeWebview || typeof window === 'undefined') return

    const updateState = () => {
      const openCount = getOpenOverlayCount()
      if (lastCountRef.current !== openCount) {
        lastCountRef.current = openCount
        notifyNativeModalState(openCount)
      }
    }

    updateState()

    const observer = new MutationObserver(() => {
      updateState()
    })

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-state', 'class', 'style', 'aria-hidden'],
      })
    }

    const handleNativeMessage = (event: MessageEvent) => {
      if (!event.data) return

      let payload = event.data
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload)
        } catch {
          return
        }
      }

      if (payload?.type !== 'NATIVE_BACK') return

      const prevCount = getOpenOverlayCount()
      if (prevCount > 0) {
        const escEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          code: 'Escape',
          keyCode: 27,
          which: 27,
          bubbles: true,
        })
        document.dispatchEvent(escEvent)
        setTimeout(() => {
          const nextCount = getOpenOverlayCount()
          notifyNativeModalState(nextCount)
          window.ReactNativeWebView?.postMessage(
            JSON.stringify({
              type: 'NATIVE_BACK_RESULT',
              handled: prevCount > 0,
              openCount: nextCount,
            }),
          )
        }, 50)
        return
      }

      window.ReactNativeWebView?.postMessage(
        JSON.stringify({
          type: 'NATIVE_BACK_RESULT',
          handled: false,
          openCount: prevCount,
        }),
      )
    }

    window.addEventListener('message', handleNativeMessage)
    document.addEventListener('message', handleNativeMessage as EventListener)

    return () => {
      observer.disconnect()
      window.removeEventListener('message', handleNativeMessage)
      document.removeEventListener(
        'message',
        handleNativeMessage as EventListener,
      )
    }
  }, [isNativeWebview])

  return null
}
