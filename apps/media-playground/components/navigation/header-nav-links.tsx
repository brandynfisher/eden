'use client'

import NavLinkList from '@/components/navigation/nav-link-list'
import { useSelectedLayoutSegments } from 'next/navigation'

type Props = {
  inSheet?: boolean
}

const HeaderNavLinks = ({ inSheet }: Props) => {
  const segments = useSelectedLayoutSegments() || []

  return (
    <>
      <NavLinkList
        items={[
          {
            label: 'Chat',
            segments: [`chat`],
            href: '/chat/eve',
            active: segments?.[0] === 'chat',
          },
        ]}
        segments={segments}
        inSheet={inSheet}
      />
      <NavLinkList
        items={[
          {
            label: 'Sessions',
            segments: [`sessions`],
            href: '/sessions',
            active: segments?.[0] === 'sessions',
            badge: 'BETA',
          },
        ]}
        segments={segments}
        inSheet={inSheet}
      />
      <NavLinkList
        items={[
          {
            label: 'Explore',
            segments: [`explore`],
            href: '/explore?type=creations',
            active: segments?.[0] === 'explore',
          },
        ]}
        segments={segments}
        inSheet={inSheet}
      />
      <NavLinkList
        items={[
          {
            label: 'Tools',
            segments: [`create`],
            href: '/create',
            active: segments[0] === 'create',
          },
        ]}
        segments={segments}
        inSheet={inSheet}
      />
    </>
  )
}

export default HeaderNavLinks
