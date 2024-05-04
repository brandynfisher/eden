import { sendGTMEvent } from '@next/third-parties/google'
import { conceptGenerator } from '@/lib/generator'
import { Generator } from '@edenlabs/eden-sdk'

export type AnalyticsEvent = {
  event: string
} & { [key: string]: number | string | object }

type Cookie = { [key: string]: string | undefined };

// Helper function to get a cookie by name
const getCookie = (name: string, cookieObject: Cookie): string | undefined => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))

  cookieObject[name] = match ? match[2] : undefined

  return cookieObject[name]
}

const getIdFromGACookie = (cookieValue: string) => {
  // An error check in case the _ga cookie is not found or the client ID part of it doesn't exist
  if (!cookieValue || cookieValue.length < 7) return ''

  return cookieValue.substring(6)
}

export const getGAClientIdFromCookie = (): string => {
  // Defensive check for server-side rendering as 'document' would not exist
  if (typeof document === 'undefined') return ''

  const cookie: Cookie = {}

  const gaCookie = getCookie('_ga', cookie)
  return gaCookie ? getIdFromGACookie(gaCookie) : ''
}

export const getGASessionIdFromCookie = (): string => {
  // Defensive check for server-side rendering as 'document' would not exist
  if (typeof document === 'undefined') return ''

  const cookie: Cookie = {}

  const gaCookie = getCookie(`_ga_${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID}`, cookie)
  return gaCookie ? getIdFromGACookie(gaCookie) : ''
}

export const sendAnalyticsEvents = (events: AnalyticsEvent | AnalyticsEvent[]) => {
  (Array.isArray(events) ? events : [events]).map(event => {
    sendGTMEvent(event)
  })
}

export const trackTaskCreate = (generatorName: Generator['generatorName'], cost: number) => {
  sendAnalyticsEvents([
    {
      event: 'task-create',
      generator: generatorName,
    },
    {
      event: 'spend_virtual_currency',
      virtual_currency_name: 'Manna',
      value: cost,
      item_name: generatorName !== conceptGenerator.name ? `Create - ${generatorName}` : `Train - Concept`,
    },
  ])
}

export const trackBeginCheckout = (checkoutSessionUrl: string) => {
  sendAnalyticsEvents({
    event: 'begin_checkout',
    event_callback: () => {
      sendAnalyticsEvents({
        event: 'begin_checkout',
        event_callback: () => {
          window.location.href = checkoutSessionUrl
        },
        eventTimeout: 2000,
      })
    },
    eventTimeout: 2000,
  })
}

