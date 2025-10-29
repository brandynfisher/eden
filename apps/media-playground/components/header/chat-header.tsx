// Chat-specific header for /chat route that combines main navbar with agent bar
import HeaderActions from '@/components/header/header-actions'
import HeaderLogo from '@/components/header/header-logo'
import HeaderNavLinks from '@/components/header/header-nav-links'
import { cn } from '@/lib/utils'
import { MenuIcon } from 'lucide-react'

type ChatHeaderProps = {
  onChatClick?: () => void
  className?: string
}

const ChatHeader = ({ onChatClick, className }: ChatHeaderProps) => {
  const handleHamburgerClick = () => {
    onChatClick?.()
  }

  return (
    <>
      {/* Mobile: Single navbar layout - Hamburger + HeaderActions */}
      <div
        className={cn(
          'md:hidden sticky z-50 top-0 bg-background border-b',
          className,
        )}
      >
        <header className="flex h-14 items-center gap-2 px-2">
          {/* Left section - Hamburger */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Hamburger menu - always show on mobile */}
            <button
              onClick={handleHamburgerClick}
              className="p-1 hover:bg-muted/10 rounded-lg transition-colors flex-shrink-0"
              aria-label="Toggle sidebar"
            >
              <MenuIcon className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Right section - HeaderActions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <HeaderActions hideMannaMobile />
          </div>
        </header>
      </div>

      {/* Desktop: Single navbar design */}
      <div className={cn('hidden md:block', className)}>
        {/* Top navbar - Eden logo + navigation links + profile/manna/notifications */}
        <header className="sticky z-50 top-0 flex h-14 items-center gap-4 border-b bg-background px-4">
          {/* Left section - Logo and navigation */}
          <div className="flex items-center gap-6">
            <HeaderLogo />
            <HeaderNavLinks />
          </div>

          {/* Right section - Profile, manna, notifications */}
          <HeaderActions />
        </header>
      </div>
    </>
  )
}

export default ChatHeader
