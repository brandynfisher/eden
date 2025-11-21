'use client'

import { Separator } from '@/components/ui/separator'
import { useLastAgent } from '@/hooks/use-last-agent'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

interface HeaderNavLinksProps {
  className?: string
  orientation?: 'horizontal' | 'vertical'
  onLinkClick?: () => void
}

const HeaderNavLinks = ({
  className,
  orientation = 'horizontal',
  onLinkClick,
}: HeaderNavLinksProps) => {
  const { getChatUrl, isHydrated } = useLastAgent()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isActive = (path: string) => {
    if (path === 'chat') {
      return pathname?.startsWith('/chat')
    }
    if (path === 'sessions') {
      return pathname?.startsWith('/sessions')
    }
    if (path === 'tools') {
      return (
        (pathname?.startsWith('/explore') &&
          searchParams?.get('type') === 'tools') ||
        pathname?.startsWith('/studio')
      )
    }
    if (path === 'explore') {
      return (
        pathname?.startsWith('/explore') &&
        searchParams?.get('type') !== 'tools'
      )
    }
    return false
  }

  const getLinkClassName = (path: string) => {
    const active = isActive(path)
    return cn(
      'text-muted-foreground transition-colors hover:text-foreground capitalize py-1.5 px-1 sm:px-2 hover:bg-accent hover:shadow-sm rounded-md font-semibold text-xs sm:text-sm whitespace-nowrap flex-shrink-0',
      active ? 'text-foreground bg-accent/50' : '',
    )
  }

  const baseClassName =
    orientation === 'horizontal'
      ? 'flex items-center gap-0 sm:gap-4 text-xs sm:text-sm overflow-x-auto'
      : 'flex flex-col gap-2 text-sm'

  const handleLinkClick = () => {
    onLinkClick?.()
  }

  // Special links for /studio page
  const isStudioPage = pathname?.startsWith('/studio')

  return (
    <nav className={cn(baseClassName, className)}>
      <Link
        href={
          isStudioPage ? '/chat' : isHydrated ? getChatUrl() : '/chat?agent=eve'
        }
        className={getLinkClassName('chat')}
        onClick={handleLinkClick}
      >
        Chat
      </Link>
      {orientation === 'horizontal' && (
        <Separator
          orientation="vertical"
          className="h-3 sm:h-4 flex-shrink-0"
        />
      )}
      <Link
        href={isStudioPage ? '/explore?type=creations' : '/explore?type=agents'}
        className={getLinkClassName('explore')}
        onClick={handleLinkClick}
      >
        Explore
      </Link>
      {!isStudioPage && (
        <>
          {orientation === 'horizontal' && (
            <Separator
              orientation="vertical"
              className="h-3 sm:h-4 flex-shrink-0"
            />
          )}
          <Link
            href="/explore?type=tools"
            className={getLinkClassName('tools')}
            onClick={handleLinkClick}
          >
            Tools
          </Link>
        </>
      )}
    </nav>
  )
}

export default HeaderNavLinks
