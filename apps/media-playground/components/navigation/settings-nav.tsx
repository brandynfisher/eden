'use client'

import SettingsNavLinks from '@/components/navigation/settings-nav-links'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { hasPreviewAccess } from '@/hooks/use-gated-resource'
import { useMe } from '@/hooks/use-me'
import { cn } from '@/lib/utils'
import { useAuth } from '@clerk/nextjs'
import {
  ChevronDownIcon,
  CircleUserIcon,
  CreditCardIcon,
  KeyIcon,
  LinkIcon,
  ListIcon,
  RadioIcon,
  Share2Icon,
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

const SettingsNav = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const { user } = useMe({
    isAuthenticated: !!isSignedIn,
  })

  const isPreviewUser = hasPreviewAccess(user?.featureFlags)

  // Get the current page name for the dropdown button
  const getCurrentPageName = () => {
    switch (pathname) {
      case '/settings/account':
        return 'Account'
      case '/settings/subscription':
        return 'Subscription'
      case '/settings/api':
        return 'API Keys'
      case '/settings/tasks':
        return 'Tasks'
      case '/settings/integrations':
        return 'Integrations'
      case '/settings/connections':
        return 'Connections'
      case '/settings/shares':
        return 'Shares'
      default:
        return 'Settings'
    }
  }

  const navigationItems = [
    {
      section: 'General',
      items: [
        { href: '/settings/account', label: 'Account', icon: CircleUserIcon },
        {
          href: '/settings/subscription',
          label: 'Subscription',
          icon: CreditCardIcon,
        },
        {
          href: '/settings/connections',
          label: 'Connections',
          icon: LinkIcon,
        },
        {
          href: '/settings/shares',
          label: 'Shares',
          icon: Share2Icon,
        },
      ],
    },
    ...(isPreviewUser
      ? [
          {
            section: 'Developers',
            items: [
              { href: '/settings/api', label: 'API Keys', icon: KeyIcon },
            ],
          },
        ]
      : []),
    ...(isPreviewUser
      ? [
          {
            section: 'Agents',
            items: [
              { href: '/settings/tasks', label: 'Tasks', icon: ListIcon },
              {
                href: '/settings/integrations',
                label: 'Integrations',
                icon: RadioIcon,
              },
            ],
          },
        ]
      : []),
  ]

  return (
    <>
      {/* Desktop navigation */}
      <nav className="hidden md:grid gap-4 text-sm text-muted-foreground">
        <SettingsNavLinks />
      </nav>

      {/* Mobile dropdown */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
              size="sm"
            >
              {getCurrentPageName()}
              <ChevronDownIcon className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full" align="start">
            {navigationItems.map((section, sectionIndex) => (
              <div key={section.section}>
                {sectionIndex > 0 && <DropdownMenuSeparator />}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  {section.section}
                </div>
                {section.items.map(item => {
                  const Icon = item.icon
                  return (
                    <DropdownMenuItem
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      className={cn(
                        'flex items-center gap-2',
                        pathname === item.href && 'bg-accent',
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </DropdownMenuItem>
                  )
                })}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Separator orientation="horizontal" className="mt-4" />
      </div>
    </>
  )
}

export default SettingsNav
