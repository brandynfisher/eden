import axios from 'axios'

const sendAnalyticsEvent = async (params: URLSearchParams) => {
  try {
    const response = await axios.post(`https://www.google-analytics.com/batch?${params.toString()}`)
    console.log('sendAnalyticsEvent', response)
  } catch (e) {
    console.error(e)
  }
}

export const trackCheckoutComplete = async (analyticsClientId: string) => {
  console.log('Purchase tracked', analyticsClientId)

  const params = new URLSearchParams({
    v: '1', // Version
    tid: '424041263', // Tracking ID / Property ID.
    cid: analyticsClientId, // Client ID
    t: 'event', // Event hit type
    ec: 'ecommerce', // Event Category
    ea: 'purchase', // Event Action
  })

  await sendAnalyticsEvent(params)
}