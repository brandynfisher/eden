import { ToolV2 } from '@edenlabs/eden-sdk'
import { sendGTMEvent } from '@next/third-parties/google'

export type AnalyticsEvent = {
  event: string
} & { [key: string]: number | string | object }

type Cookie = { [key: string]: string | undefined }

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

  try {
    const cookie: Cookie = {}

    const gaCookie = getCookie('_ga', cookie)
    return gaCookie ? getIdFromGACookie(gaCookie) : ''
  } catch (error) {
    console.error('Error getting GAClientIdFromCookie', error)
    return ''
  }
}

export const sendAnalyticsEvents = (
  events: AnalyticsEvent | AnalyticsEvent[],
) => {
  (Array.isArray(events) ? events : [events]).map(event => {
    sendGTMEvent(event)
  })
}

const trainerToolNames = ['flux_trainer', 'lora_trainer']

export const trackTaskCreate = (toolName: ToolV2['key'], cost: number) => {
  const events: AnalyticsEvent[] = [
    {
      event: 'task-create',
      tool: toolName,
    },
    {
      event: 'spend_virtual_currency',
      virtual_currency_name: 'Manna',
      value: cost,
      item_name: !trainerToolNames.includes(toolName)
        ? `Create - ${toolName}`
        : `Train - ${toolName}`,
    },
  ]
  console.log('trackTaskCreate', events)
  sendAnalyticsEvents(events)
}
