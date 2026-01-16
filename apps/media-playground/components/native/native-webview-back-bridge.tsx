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

const getHasOpenOverlay = () => {
  if (typeof document === 'undefined') return false
  return !!document.querySelector(OPEN_OVERLAY_SELECTOR)
}

const notifyNativeModalState = (open: boolean) => {
  if (typeof window === 'undefined') return
  window.ReactNativeWebView?.postMessage(
    JSON.stringify({ type: 'NATIVE_MODAL_STATE', open }),
  )
}

export default function NativeWebviewBackBridge() {
  const isNativeWebview = useNativeWebview()
  const lastOpenRef = useRef<boolean | null>(null)

  useEffect(() => {
    if (!isNativeWebview || typeof window === 'undefined') return

    const updateState = () => {
      const open = getHasOpenOverlay()
      if (lastOpenRef.current !== open) {
        lastOpenRef.current = open
        notifyNativeModalState(open)
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

      if (getHasOpenOverlay()) {
        const escEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          code: 'Escape',
          keyCode: 27,
          which: 27,
          bubbles: true,
        })
        document.dispatchEvent(escEvent)
        setTimeout(updateState, 0)
      }
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
