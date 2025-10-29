// Chat-specific header for /chat route that combines main navbar with agent bar
import HeaderActions from '@/components/header/header-actions'
import HeaderLogo from '@/components/header/header-logo'
import HeaderNavLinks from '@/components/header/header-nav-links'
import { ModeToggle } from '@/components/header/mode-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SessionShareButton } from '@/features/sessions/components/session-share-button'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useAgentPermissions } from '@/hooks/use-agent-permissions'
import { useAuthState } from '@/hooks/use-auth-state'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { Agent } from '@edenlabs/eden-sdk'
import { ChevronRightIcon, MenuIcon } from 'lucide-react'
import { useParams } from 'next/navigation'

type ChatHeaderProps = {
  agent: Agent | null | undefined
  onChatClick?: () => void
  onAgentSelect?: () => void
  onSettingsClick?: () => void
  viewMode?: string
  onBackToChat?: () => void
  className?: string
}

const ChatHeader = ({
  agent,
  onChatClick,
  onAgentSelect,
  onSettingsClick,
  viewMode,
  onBackToChat,
  className,
}: ChatHeaderProps) => {
  const params = useParams()
  const { user } = useAuthState()
  const sessionId = params?.id as string

  // Get current session data
  const { data: session } = useSessionQuery({
    sessionId: sessionId,
    enabled: !!sessionId && sessionId !== 'new',
  })

  // Use the new permissions hook instead of the deprecated canEditAgent function
  const { hasEditAccess } = useAgentPermissions(agent, user?._id)
  const showSettingsIcon = agent && hasEditAccess

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

      {/* Desktop: Two navbar design */}
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

        {/* Bottom navbar - Agent info + Mode toggle on left, share button on right */}
        <header className="sticky z-40 top-14 flex h-12 items-center gap-4 border-b bg-muted/30 px-4 py-2">
          {/* Left section - Agent info + Mode toggle */}
          <div className="flex items-center gap-3 min-w-0">
            {agent ? (
              <>
                {/* Agent selector button */}
                <button
                  onClick={onAgentSelect}
                  className="flex items-center gap-2 hover:bg-muted/10 rounded-lg px-1 py-1 transition-all duration-200 hover:scale-[1.02] min-w-0"
                >
                  <Avatar className="w-9 h-9 border-2 border-primary/20 hover:border-primary/40 transition-colors">
                    <AvatarImage
                      src={
                        agent.userImage && agent.userImage.trim()
                          ? getCloudfrontOriginalUrl(agent.userImage)
                          : undefined
                      }
                      alt={agent.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-muted text-sm font-medium">
                      {agent.username?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-bold text-[1.09375rem] text-foreground truncate max-w-[200px]">
                    {agent.username}
                  </span>
                  <ChevronRightIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>

                {/* Mode Toggle - only show if user has edit access */}
                {showSettingsIcon && (
                  <ModeToggle
                    mode={viewMode === 'settings' ? 'settings' : 'chat'}
                    onModeChange={mode => {
                      if (mode === 'settings') {
                        onSettingsClick?.()
                      } else {
                        onBackToChat?.()
                      }
                    }}
                    variant="sidebar"
                  />
                )}
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                <div className="w-32 h-5 bg-muted animate-pulse rounded" />
              </div>
            )}
          </div>

          {/* Right section - Share button */}
          <div className="ml-auto flex items-center gap-2">
            {session && session.owner._id === user?._id && (
              <SessionShareButton
                sessionId={sessionId}
                messages={session.messages || []}
                isOwner={session.owner._id === user?._id}
                isPublic={session.extras?.is_public}
                className="h-9 w-auto px-3"
              />
            )}
          </div>
        </header>
      </div>
    </>
  )
}

export default ChatHeader
