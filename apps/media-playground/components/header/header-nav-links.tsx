import { Separator } from '@/components/ui/separator'
import { useLastAgent } from '@/hooks/use-last-agent'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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

  const isActive = (path: string) => {
    if (path === 'chat') {
      return pathname?.startsWith('/chat') || pathname?.startsWith('/sessions')
    }
    if (path === 'explore') {
      return pathname?.startsWith('/explore')
    }
    if (path === 'tools') {
      return pathname?.startsWith('/create')
    }
    return false
  }

  const getLinkClassName = (path: string) => {
    const active = isActive(path)
    return cn(
      'text-muted-foreground transition-colors hover:text-foreground capitalize py-1.5 px-2 hover:bg-accent hover:shadow-sm rounded-md font-semibold',
      active ? 'text-foreground bg-accent/50' : '',
    )
  }

  const baseClassName =
    orientation === 'horizontal'
      ? 'flex items-center gap-4 text-sm'
      : 'flex flex-col gap-2 text-sm'

  const handleLinkClick = () => {
    onLinkClick?.()
  }

  return (
    <nav className={cn(baseClassName, className)}>
      <Link
        href={isHydrated ? getChatUrl() : '/chat/eve'}
        className={getLinkClassName('chat')}
        onClick={handleLinkClick}
      >
        Chat
      </Link>
      {orientation === 'horizontal' && (
        <Separator orientation="vertical" className="h-4" />
      )}
      <Link
        href="/explore?type=agents"
        className={getLinkClassName('explore')}
        onClick={handleLinkClick}
      >
        Explore
      </Link>
      {orientation === 'horizontal' && (
        <Separator orientation="vertical" className="h-4" />
      )}
      <Link
        href="/create/image/flux_schnell"
        className={getLinkClassName('tools')}
        onClick={handleLinkClick}
      >
        Tools
      </Link>
    </nav>
  )
}

export default HeaderNavLinks
