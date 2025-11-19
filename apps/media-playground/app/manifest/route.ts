import { getAgentCached } from '@/lib/actions/agent'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const agentId = searchParams.get('agent')

  // Default manifest for homepage
  if (!agentId) {
    return Response.json({
      name: 'Eden',
      short_name: 'Eden',
      description: 'Garden of Artificial Delights',
      start_url: '/',
      scope: '/',
      display: 'fullscreen',
      background_color: '#030712',
      theme_color: '#030712',
      icons: [
        {
          src: '/favicon-16x16.png',
          sizes: '16x16',
          type: 'image/png',
        },
        {
          src: '/favicon-32x32.png',
          sizes: '32x32',
          type: 'image/png',
        },
        {
          src: '/favicon.ico',
          sizes: '48x48',
          type: 'image/x-icon',
        },
        {
          src: '/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    })
  }

  // Agent-specific manifest
  try {
    const response = await getAgentCached(agentId)

    if (!response?.agent) {
      // Return default manifest if agent not found
      return Response.json({
        name: 'Eden',
        short_name: 'Eden',
        description: 'Garden of Artificial Delights',
        start_url: '/',
        scope: '/',
        display: 'fullscreen',
        background_color: '#030712',
        theme_color: '#030712',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      })
    }

    const agent = response.agent
    const agentName = agent.name || 'Agent'
    const agentDescription =
      agent.description || `${agentName}, an AI agent on Eden`

    // Use agent's profile image if available, otherwise use default Eden icons
    const icons = agent.userImage
      ? [
          {
            src: agent.userImage,
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: agent.userImage,
            sizes: '512x512',
            type: 'image/png',
          },
        ]
      : [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ]

    return Response.json({
      name: `${agentName}`,
      short_name: agentName,
      description: agentDescription,
      start_url: `/realtime/${agentId}`,
      scope: `/realtime/${agentId}`,
      display: 'fullscreen',
      background_color: '#030712',
      theme_color: '#030712',
      icons,
    })
  } catch (error) {
    console.error('Error generating agent manifest:', error)

    // Return default manifest on error
    return Response.json({
      name: 'Eden',
      short_name: 'Eden',
      description: 'Garden of Artificial Delights',
      start_url: '/',
      scope: '/',
      display: 'fullscreen',
      background_color: '#030712',
      theme_color: '#030712',
      icons: [
        {
          src: '/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    })
  }
}
