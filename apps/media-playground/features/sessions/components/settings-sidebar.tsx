'use client'

import { cn } from '@/lib/utils'
import {
  BarChart3Icon,
  BrainIcon,
  ClockIcon,
  ImageIcon,
  KeyIcon,
  SettingsIcon,
  UserIcon,
  WrenchIcon,
} from 'lucide-react'
import { FC } from 'react'

interface SettingsTab {
  key: string
  label: string
  icon: typeof UserIcon
  description?: string
}

interface SettingsSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isOriginalOwner: boolean
  hasOwnerAccess: boolean
  hasEditAccess: boolean
  isPreviewUser: boolean
  onItemClick?: () => void
}

export const SettingsSidebar: FC<SettingsSidebarProps> = ({
  activeTab,
  onTabChange,
  isOriginalOwner,
  hasOwnerAccess,
  hasEditAccess,
  isPreviewUser,
  onItemClick,
}) => {
  // Get available tabs based on permissions
  // Order: Profile, Tasks, Dashboard, Concepts, Memories, Tools, Integrations, Permissions
  const getAvailableTabs = (): SettingsTab[] => {
    const tabs: SettingsTab[] = []

    // 1. Profile - All users with edit access
    if (hasEditAccess) {
      tabs.push({
        key: 'profile',
        label: 'Profile',
        icon: UserIcon,
        description: 'Basic settings and persona',
      })
    }

    // 2. Tasks - Preview users with owner access
    if (hasOwnerAccess && isPreviewUser) {
      tabs.push({
        key: 'tasks',
        label: 'Tasks',
        icon: ClockIcon,
        description: 'Scheduled operations',
      })
    }

    // 3. Dashboard - All users with edit access
    if (hasEditAccess) {
      tabs.push({
        key: 'dashboard',
        label: 'Dashboard',
        icon: BarChart3Icon,
        description: 'Analytics and insights',
      })
    }

    // 4. Concepts - Owners only
    if (hasOwnerAccess) {
      tabs.push({
        key: 'concepts',
        label: 'Concepts',
        icon: ImageIcon,
        description: 'Visual knowledge and styles',
      })
    }

    // 5. Memories - Preview users with owner access
    if (hasOwnerAccess && isPreviewUser) {
      tabs.push({
        key: 'memories',
        label: 'Memories',
        icon: BrainIcon,
        description: 'Agent knowledge base',
      })
    }

    // 6. Tools - Owners only
    if (hasOwnerAccess) {
      tabs.push({
        key: 'tools',
        label: 'Tools',
        icon: WrenchIcon,
        description: 'Configure agent capabilities',
      })
    }

    // 7. Integrations - Preview users with owner access
    if (hasOwnerAccess && isPreviewUser) {
      tabs.push({
        key: 'integrations',
        label: 'Integrations',
        icon: SettingsIcon,
        description: 'External connections',
      })
    }

    // 8. Permissions - Original owner only (preview users)
    if (isOriginalOwner && isPreviewUser) {
      tabs.push({
        key: 'permissions',
        label: 'Permissions',
        icon: KeyIcon,
        description: 'Access control',
      })
    }

    return tabs
  }

  const availableTabs = getAvailableTabs()

  const handleTabClick = (tabKey: string) => {
    onTabChange(tabKey)
    onItemClick?.()
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Navigation items */}
      <nav className="flex flex-col gap-1 overflow-y-auto flex-1 mr-2 min-h-0">
        {availableTabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key

          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={cn(
                'group flex items-start gap-3 rounded-lg px-3 py-3 transition-all text-left border',
                'hover:bg-muted/50',
                isActive
                  ? 'bg-primary/40 hover:bg-primary/30 border-primary/60 text-primary-foreground'
                  : 'text-foreground border-transparent',
              )}
            >
              <Icon
                className={cn(
                  'size-5 mt-0.5 flex-shrink-0 transition-colors',
                  isActive
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground group-hover:text-foreground',
                )}
              />
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="font-medium text-sm">{tab.label}</span>
                {tab.description && (
                  <span
                    className={cn(
                      'text-xs line-clamp-2',
                      isActive
                        ? 'text-primary-foreground/80'
                        : 'text-muted-foreground group-hover:text-foreground/80',
                    )}
                  >
                    {tab.description}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
