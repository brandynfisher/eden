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
    'text-lg font-semibold text-muted-foreground hover:text-foreground transition-colors'

  const baseClassName =
    orientation === 'horizontal'
      ? 'flex items-center gap-6'
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
      {orientation === 'horizontal' && (
        <span className="text-muted-foreground/60 text-sm">|</span>
      )}
      <Link
        href="/explore?type=agents"
        className={linkClassName}
        onClick={handleLinkClick}
      >
        Explore
      </Link>
      {orientation === 'horizontal' && (
        <span className="text-muted-foreground/60 text-sm">|</span>
      )}
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
