'use client'

type OpenPopupOptions = {
  name: string
  features?: string
  title?: string
  message?: string
}

export const openOAuthPopup = ({
  name,
  features,
  title = 'Connecting...',
  message = 'Connecting...',
}: OpenPopupOptions) => {
  const popup = window.open('about:blank', name, features)
  if (!popup) return null

  try {
    popup.document.write(
      `<!doctype html><title>${title}</title><body style="font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0b1220; color: #e2e8f0;"><div>${message}</div></body>`,
    )
    popup.document.close()
  } catch {
    // Ignore write errors (some browsers block document.write for popups)
  }

  return popup
}
