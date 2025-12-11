import { handleAxiosServerError } from '@/lib/fetcher'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

// Google Calendar OAuth endpoints are on the Eve (Python) backend, not Fastify.
// Local: http://localhost:8000
// Production: https://edenartlab--api-prod-fastapi-app.modal.run
// Staging: https://edenartlab--api-stage-fastapi-app.modal.run
const EVE_API_URL = process.env.EVE_API_URL || 'http://localhost:8000'

// Eve backend requires admin key for the callback endpoint
const EDEN_ADMIN_KEY = process.env.EDEN_ADMIN_KEY

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors from Google
  if (error) {
    return createPopupResponse({
      success: false,
      message: errorDescription || `OAuth error: ${error}`,
    })
  }

  if (!code || !state) {
    return createPopupResponse({
      success: false,
      message: 'Missing authorization code or state',
    })
  }

  if (!EDEN_ADMIN_KEY) {
    console.error('EDEN_ADMIN_KEY is not configured')
    return createPopupResponse({
      success: false,
      message: 'Server configuration error',
    })
  }

  try {
    // Exchange code for tokens via Eve backend
    // The code and state are passed as query parameters
    const response = await axios.post(
      `${EVE_API_URL}/v2/auth/google-calendar/callback`,
      null,
      {
        params: { code, state },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${EDEN_ADMIN_KEY}`,
        },
      },
    )

    return createPopupResponse({
      success: true,
      result: response.data,
    })
  } catch (error) {
    console.error('Google Calendar OAuth callback error:', error)
    const errorMessage = handleAxiosServerError(error)
    return createPopupResponse({
      success: false,
      message: errorMessage || 'Failed to complete OAuth',
    })
  }
}

function createPopupResponse(data: {
  success: boolean
  message?: string
  result?: unknown
}) {
  // Create HTML page that sends message to parent window and closes
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Google Calendar Connection</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #1a1a2e;
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .spinner {
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: #3b82f6;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .success { color: #22c55e; }
    .error { color: #ef4444; }
    .message {
      margin-top: 1rem;
      font-size: 0.875rem;
      color: rgba(255,255,255,0.7);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <p>${data.success ? 'Connected successfully!' : 'Processing...'}</p>
    ${
      data.message && !data.success
        ? `<p class="message error">${data.message}</p>`
        : ''
    }
  </div>
  <script>
    (function() {
      const data = ${JSON.stringify(data)};

      // Send message to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'google-calendar-link',
          ...data
        }, '*');

        // Close popup after short delay
        setTimeout(() => {
          window.close();
        }, 1500);
      } else {
        // Not in popup, show message and redirect to settings
        document.querySelector('.container').innerHTML = \`
          <p class="\${data.success ? 'success' : 'error'}">
            \${data.success ? 'Google Calendar connected successfully!' : data.message || 'Failed to connect'}
          </p>
          <p class="message">Redirecting...</p>
        \`;
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    })();
  </script>
</body>
</html>
`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  })
}
