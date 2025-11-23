export const USER_SETTINGS_EVENT = 'eden-open-user-settings'
const SUBSCRIPTION_TAB = 'subscription'

declare global {
  interface Window {
    __edenSettingsListenerReady?: boolean
  }
}

export const openUserSettingsModal = (tab: string = SUBSCRIPTION_TAB) => {
  if (typeof window === 'undefined') return

  window.dispatchEvent(
    new CustomEvent(USER_SETTINGS_EVENT, { detail: { tab } }),
  )
}

export const markUserSettingsListenerReady = () => {
  if (typeof window === 'undefined') return
  window.__edenSettingsListenerReady = true
}
