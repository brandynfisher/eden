'use client'

import { Separator } from '@/components/ui/separator'
import { useMe } from '@/hooks/use-me'
import { cn } from '@/lib/utils'
import { useAuth } from '@clerk/nextjs'
import { FeatureFlag } from '@edenlabs/eden-sdk'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SettingsNavLinks = () => {
  const pathname = usePathname()
  const { isSignedIn } = useAuth()
  const { user } = useMe({
    isAuthenticated: !!isSignedIn,
  })

  const isPreviewUser = user?.featureFlags?.includes(FeatureFlag.Preview)

  const isActive = (path: string) => pathname === path

  return (
    <>
      <div className="flex flex-col gap-2 text-foreground/90">
        <div className="text-muted-foreground font-bold text-xs">General</div>
        <Link
          href="/settings/account"
          className={cn(
            'px-2 py-1.5 rounded-md',
            isActive('/settings/account') && 'bg-muted/50 text-foreground',
            '[@media(pointer:fine)]:hover:bg-accent/75 hover:text-popover-foreground',
          )}
        >
          Account
        </Link>
        <Link
          href="/settings/subscription"
          className={cn(
            'px-2 py-1.5 rounded-md',
            isActive('/settings/subscription') && 'bg-muted/50 text-foreground',
            '[@media(pointer:fine)]:hover:bg-accent/75 hover:text-popover-foreground',
          )}
        >
          Subscription
        </Link>
        <Link
          href="/settings/connections"
          className={cn(
            'px-2 py-1.5 rounded-md',
            isActive('/settings/connections') && 'bg-muted/50 text-foreground',
            '[@media(pointer:fine)]:hover:bg-accent/75 hover:text-popover-foreground',
          )}
        >
          Connections
        </Link>
        <Link
          href="/settings/shares"
          className={cn(
            'px-2 py-1.5 rounded-md',
            isActive('/settings/shares') && 'bg-muted/50 text-foreground',
            '[@media(pointer:fine)]:hover:bg-accent/75 hover:text-popover-foreground',
          )}
        >
          Shares
        </Link>
      </div>

      {isPreviewUser && (
        <div className="flex flex-col gap-2 text-foreground/90">
          <div className="text-muted-foreground font-bold text-xs">
            Developers
          </div>
          <Link
            href="/settings/api"
            className={cn(
              'px-2 py-1.5 rounded-md',
              isActive('/settings/api') && 'bg-muted/50 text-foreground',
              '[@media(pointer:fine)]:hover:bg-accent/75 hover:text-popover-foreground',
            )}
          >
            API Keys
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-2 text-foreground/90">
        {isPreviewUser && (
          <>
            <div className="text-muted-foreground font-bold text-xs">
              Agents
            </div>
            <Link
              href="/settings/tasks"
              className={cn(
                'px-2 py-1.5 rounded-md',
                isActive('/settings/tasks') && 'bg-muted/50 text-foreground',
                '[@media(pointer:fine)]:hover:bg-accent/75 hover:text-popover-foreground',
              )}
            >
              Tasks
            </Link>
            <Link
              href="/integrations"
              className={cn(
                'px-2 py-1.5 rounded-md',
                isActive('/integrations') && 'bg-muted/50 text-foreground',
                '[@media(pointer:fine)]:hover:bg-accent/75 hover:text-popover-foreground',
              )}
            >
              Integrations
            </Link>
          </>
        )}
      </div>
      <Separator orientation="horizontal" className="md:hidden" />
    </>
  )
}

export default SettingsNavLinks
