export const CONFIG = {
  API_URL: process.env.EDEN_API_URL || 'http://0.0.0.0:5050',
  DEV_TYPE: process.env.NEXT_PUBLIC_DEV_TYPE || 'eden',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
}
