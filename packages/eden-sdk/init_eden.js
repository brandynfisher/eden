const { EdenClient } = require('@edenlabs/eden-sdk')
const dotenv = require('dotenv')
dotenv.config()

// Now you can use the environment variables from your .env file
const apiKey = process.env.EDEN_API_KEY
const apiSecret = process.env.EDEN_SECRET_KEY

const eden = new EdenClient({
  edenApiUrl: 'https://staging.api.eden.art',
  // edenApiUrl: 'http://localhost:5050',
  apiKey,
  // apiSecret,
})

module.exports = eden
