'use client'

import ApiKeysCard from './api-keys-card'
import DeleteAccountCard from './delete-account-card'
import ManageAccountCard from './manage-account-card'
import MannaCard from './manna-card'
import { OrderStateCard } from './order-state-card'
import SubscriptionsCard from './subscriptions-card'
import { TransactionHistory } from './transaction-history'
import { UserPreferences } from './user-preferences'
import IntegrationsPage from '@/app/settings/integrations/page'
import TasksPage from '@/app/settings/tasks/page'
import DiscordAuthButton from '@/components/button/discord-auth-button'
import InstagramAuthButton from '@/components/button/instagram-auth-button'
import TwitterAuthButton from '@/components/button/twitter-auth-button'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMe } from '@/hooks/use-me'
import { cn } from '@/lib/utils'
import { updateDeleteDialog } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { useAuth } from '@clerk/nextjs'
import { FeatureFlag, SessionShare } from '@edenlabs/eden-sdk'
import {
  CircleUserIcon,
  CreditCardIcon,
  ExternalLink,
  KeyIcon,
  LinkIcon,
  ListIcon,
  Loader2,
  RadioIcon,
  Share2Icon,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { FC, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface UserSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab?: string
}

// Connections Tab Component
const ConnectionsTab: FC<{
  user: ReturnType<typeof useMe>['user']
}> = ({ user }) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Discord</CardTitle>
          <CardDescription>
            {user?.discordId
              ? 'Your Discord account is connected. You can disconnect it below.'
              : 'Connect your Discord account to Eden.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DiscordAuthButton />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>X (Twitter)</CardTitle>
          <CardDescription>
            {user?.twitterHandle ? (
              <>
                Connected as @{user.twitterHandle}. You can disconnect your X
                account below.
              </>
            ) : (
              'Connect your X (Twitter) account to Eden.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TwitterAuthButton />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instagram</CardTitle>
          <CardDescription>
            {user?.instagramHandle ? (
              <>
                Connected as @{user.instagramHandle}. You can disconnect your
                Instagram account below.
              </>
            ) : (
              'Connect your Instagram account to Eden.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InstagramAuthButton />
        </CardContent>
      </Card>
    </div>
  )
}

// Shares Tab Component
const SharesTab: FC = () => {
  const dispatch = useAppDispatch()
  const [shares, setShares] = useState<SessionShare[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  const fetchShares = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/v2/sessions/shares')
      const data = await response.json()
      if (data.shares) {
        setShares(data.shares)
      }
    } catch (error) {
      console.error('Failed to fetch shares:', error)
      toast.error('Failed to load shares')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchShares()
  }, [])

  const handleDelete = (shareId: string, shareTitle?: string) => {
    dispatch(
      updateDeleteDialog({
        isOpen: true,
        title: 'Delete Share',
        description: `Are you sure you want to delete ${
          shareTitle ? `"${shareTitle}"` : 'this share'
        }? This will make the link no longer accessible to anyone.`,
        onDelete: async () => {
          setDeletingIds(prev => new Set(prev).add(shareId))

          try {
            const response = await fetch(`/api/v2/sessions/shares/${shareId}`, {
              method: 'DELETE',
            })

            if (!response.ok) {
              throw new Error('Failed to delete share')
            }

            toast.success('Share deleted successfully')
            setShares(shares.filter(share => share._id !== shareId))
          } catch (error) {
            console.error('Failed to delete share:', error)
            toast.error('Failed to delete share')
          } finally {
            setDeletingIds(prev => {
              const newSet = new Set(prev)
              newSet.delete(shareId)
              return newSet
            })
          }
        },
      }),
    )
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">
        Manage your public session shares. These are conversations you've shared
        with others.
      </p>

      <div className="space-y-4">
        {shares.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                You haven't created any shares yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          shares.map(share => (
            <Card key={share._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {share.title ||
                        share.session?.title ||
                        'Untitled Session'}
                    </CardTitle>
                    <CardDescription>
                      Created {formatDate(share.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/sessions/share/${share._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        handleDelete(
                          share._id,
                          share.title ||
                            share.session?.title ||
                            'Untitled Session',
                        )
                      }
                      disabled={deletingIds.has(share._id)}
                    >
                      {deletingIds.has(share._id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {share.session?.context && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {share.session.context}
                  </p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </>
  )
}

export const UserSettingsModal: FC<UserSettingsModalProps> = ({
  open,
  onOpenChange,
  initialTab = 'account',
}) => {
  const { isSignedIn } = useAuth()
  const { user, isLoading: isUserLoading } = useMe({
    isAuthenticated: !!isSignedIn,
  })
  const isPreviewUser = user?.featureFlags?.includes(FeatureFlag.Preview)

  const [activeTab, setActiveTab] = useState(initialTab)

  // Reset active tab when modal opens
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab)
    }
  }, [open, initialTab])

  // Get available tabs based on user permissions
  const getAvailableTabs = () => {
    const tabs: Array<{
      key: string
      label: string
      icon: typeof CircleUserIcon
      section: string
    }> = [
      {
        key: 'account',
        label: 'Account',
        icon: CircleUserIcon,
        section: 'General',
      },
      {
        key: 'subscription',
        label: 'Subscription',
        icon: CreditCardIcon,
        section: 'General',
      },
      {
        key: 'connections',
        label: 'Connections',
        icon: LinkIcon,
        section: 'General',
      },
      {
        key: 'shares',
        label: 'Shares',
        icon: Share2Icon,
        section: 'General',
      },
    ]

    if (isPreviewUser) {
      tabs.push({
        key: 'api',
        label: 'API Keys',
        icon: KeyIcon,
        section: 'Developers',
      })
      tabs.push({
        key: 'tasks',
        label: 'Tasks',
        icon: ListIcon,
        section: 'Agents',
      })
      tabs.push({
        key: 'integrations',
        label: 'Integrations',
        icon: RadioIcon,
        section: 'Agents',
      })
    }

    return tabs
  }

  const availableTabs = getAvailableTabs()

  // Group tabs by section
  const groupedTabs = availableTabs.reduce((acc, tab) => {
    if (!acc[tab.section]) {
      acc[tab.section] = []
    }
    acc[tab.section].push(tab)
    return acc
  }, {} as Record<string, typeof availableTabs>)

  if (isUserLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[90vh] p-0">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0">
        <DialogTitle className="sr-only">User Settings</DialogTitle>
        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          {/* Desktop Sidebar - Hidden on mobile */}
          <div className="hidden md:flex w-56 border-r bg-muted/30 flex-col">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-lg">Settings</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {user?.username || 'User'}
              </p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {Object.entries(groupedTabs).map(([section, tabs]) => (
                  <div key={section} className="mb-4">
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                      {section}
                    </div>
                    <div className="space-y-1">
                      {tabs.map(tab => {
                        const Icon = tab.icon
                        return (
                          <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left',
                              activeTab === tab.key
                                ? 'bg-background text-foreground font-medium shadow-sm'
                                : 'text-muted-foreground hover:bg-background/50 hover:text-foreground',
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            {tab.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Mobile Header with Horizontal Tabs */}
          <div className="md:hidden border-b bg-background">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-base">
                {availableTabs.find(t => t.key === activeTab)?.label ||
                  'Settings'}{' '}
                <span className="text-sm text-muted-foreground font-normal">
                  {user?.username || 'User'}
                </span>
              </h2>
            </div>
            <div className="w-full">
              <div className="flex flex-wrap gap-1 p-2">
                {availableTabs.map(tab => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                        activeTab === tab.key
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {activeTab === 'account' && (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Account</h3>
                      <ManageAccountCard />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Preferences
                      </h3>
                      <UserPreferences />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Transaction History
                      </h3>
                      <TransactionHistory />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-destructive">
                        Danger Zone
                      </h3>
                      <DeleteAccountCard />
                    </div>
                  </>
                )}

                {activeTab === 'subscription' && (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Subscription & Manna
                      </h3>
                      <div className="space-y-6">
                        <SubscriptionsCard />
                        <MannaCard />
                        <OrderStateCard />
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'connections' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Connections</h3>
                    <ConnectionsTab user={user} />
                  </div>
                )}

                {activeTab === 'shares' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Session Shares
                    </h3>
                    <SharesTab />
                  </div>
                )}

                {activeTab === 'api' && isPreviewUser && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">API Keys</h3>
                    <ApiKeysCard />
                  </div>
                )}

                {activeTab === 'tasks' && isPreviewUser && <TasksPage />}

                {activeTab === 'integrations' && isPreviewUser && (
                  <IntegrationsPage />
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
