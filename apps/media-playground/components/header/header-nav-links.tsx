import { useLastAgent } from '@/hooks/use-last-agent'
import { cn } from '@/lib/utils'
import Link from 'next/link'

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

  const linkClassName =
    'text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'

  const baseClassName =
    orientation === 'horizontal'
      ? 'flex items-center gap-4'
      : 'flex flex-col gap-2'

  const handleLinkClick = () => {
    onLinkClick?.()
  }

  return (
    <nav className={cn(baseClassName, className)}>
      <Link
        href={isHydrated ? getChatUrl() : '/chat/eve'}
        className={linkClassName}
        onClick={handleLinkClick}
      >
        Chat
      </Link>
      <Link
        href="/explore?type=agents"
        className={linkClassName}
        onClick={handleLinkClick}
      >
        Explore
      </Link>
      <Link
        href="/explore?type=tools"
        className={linkClassName}
        onClick={handleLinkClick}
      >
        Tools
      </Link>
    </nav>
  )
}

export default HeaderNavLinks
