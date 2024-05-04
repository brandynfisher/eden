import axios from 'axios'

type AnalyticsEvent = {
  name: string
  params: { [key: string]: any }
}

type AnalyticsData = {
  client_id: string,
  events: AnalyticsEvent[]
}

type AnalyticsCheckoutItem = {
  item_id: string,
  item_name: string,
  currency: string,
  index: number,
  item_brand: string
  item_category: string
  item_variant?: string
  price: number,
  quantity: number
}

type AnalyticsCheckoutData = {
  currency: string,
  transaction_id: string,
  value: number,
  tax: number,
  items: AnalyticsCheckoutItem[]
}

const sendAnalyticsEvents = async (data: AnalyticsData) => {
  try {
    const response = await axios.post(
      `https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GOOGLE_ANALYTICS_MEASUREMENT_ID}&api_secret=${process.env.GOOGLE_ANALYTICS_API_SECRET}`,
      data,
    )
    console.log('sendAnalyticsEvent', response)
  } catch (e) {
    console.error(e)
  }
}

export const trackCheckoutComplete = async (analyticsClientId: string, checkoutData: AnalyticsCheckoutData) => {
  console.log('Purchase tracked', analyticsClientId)

  const data = {
    client_id: analyticsClientId,
    events: [{
      name: 'purchase',
      params: checkoutData,
    }],
  }

  await sendAnalyticsEvents(data)
}