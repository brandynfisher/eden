'use client'

import ReactDOM from 'react-dom'

export function PreloadResources() {
  if (process.env.NODE_ENV === 'production') {
    ReactDOM.preconnect('https://clerk.eden.art', { crossOrigin: 'use-credentials' })
    ReactDOM.preconnect('https://www.googletagmanager.com', { crossOrigin: 'anonymous' })
  } else {
    ReactDOM.preconnect('https://oriented-glider-22.clerk.accounts.dev/', { crossOrigin: 'use-credentials' })
  }

  return null
}