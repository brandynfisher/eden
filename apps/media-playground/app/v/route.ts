import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')

  if (!url) {
    return new Response('Missing url parameter', { status: 400 })
  }

  // Simple HTML with OG tags for video embedding
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta property="og:type" content="video.other" />
  <meta property="og:video" content="${url}" />
  <meta property="og:video:secure_url" content="${url}" />
  <meta property="og:video:type" content="video/mp4" />
  <meta property="og:video:width" content="1024" />
  <meta property="og:video:height" content="1024" />
  <meta name="twitter:card" content="player" />
  <meta name="twitter:player" content="${url}" />
  <meta name="twitter:player:width" content="1024" />
  <meta name="twitter:player:height" content="1024" />
</head>
<body>
  <script>window.location.href = "${url}";</script>
</body>
</html>
  `.trim()

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}
