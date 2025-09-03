'use client'

import RouterTabs, { RouterTab } from '@/components/tabs/router-tabs'
import { Button } from '@/components/ui/button'
import AgentsFeed from '@/features/feed/agents-feed'
import CollectionsFeed from '@/features/feed/collections-feed'
import CreationsFeed, {
  CreationsFeedHandle,
} from '@/features/feed/creations-feed'
import ModelsFeed from '@/features/feed/models-feed'
import { SortMenu } from '@/features/feed/sort-menu'
import { ProfileAgentsFilter } from '@/features/profile/profile-agents-filter'
import { ProfileCollectionsFilter } from '@/features/profile/profile-collections-filter'
import { ProfileCreationsFilter } from '@/features/profile/profile-creations-filter'
import { ProfileModelsFilter } from '@/features/profile/profile-models-filter'
import { SharedAgentsSection } from '@/features/profile/shared-agents-section'
import { useCreatorQuery } from '@/hooks/query/use-creator-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { useMe } from '@/hooks/use-me'
import { FeatureFlag } from '@edenlabs/eden-sdk'
import { LightningBoltIcon } from '@radix-ui/react-icons'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'

const ProfileTabs = () => {
  const params = useParams<{ name: string }>()
  const { user, isSignedIn } = useAuthState()
  const { creator } = useCreatorQuery({ key: params?.name })
  const { user: meUser } = useMe({ isAuthenticated: !!isSignedIn })
  const pathname = usePathname()
  const router = useRouter()
  const creationsFeedRef = useRef<CreationsFeedHandle>(null)

  // NOTE: We intentionally place all hooks (useEffect/useCallback/etc.) before
  // any conditional returns to avoid changing the number/order of hooks between renders.

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle navigation if we're viewing a creation modal
      if (!pathname?.startsWith('/creations/')) return

      const creationId = pathname.split('/creations/')[1]
      if (!creationId || !creationsFeedRef.current) return

      let targetId: string | null = null

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        targetId = creationsFeedRef.current.getAdjacentCreationId(
          creationId,
          'prev',
        )
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        targetId = creationsFeedRef.current.getAdjacentCreationId(
          creationId,
          'next',
        )
      }

      if (targetId) {
        router.push(`/creations/${targetId}`)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [pathname, router])

  const handleCreationNavigation = useCallback(
    (creationId: string) => {
      // This could be used for programmatic navigation if needed
      router.push(`/creations/${creationId}`)
    },
    [router],
  )

  const isOwnProfile = creator ? user?._id === creator._id : false
  const isPreviewUser = meUser?.featureFlags?.includes(FeatureFlag.Preview)

  // Safe early return AFTER all hooks have executed to keep hook order stable.
  if (!creator || (isSignedIn && !user)) {
    return null
  }

  // Use agent-based filtering for creations if this profile represents an agent.
  const baseQuery =
    creator.type === 'agent' ? { agent: creator._id } : { user: creator._id }

  const tabs: RouterTab[] = [
    {
      key: 'creations',
      title: 'Creations',
      sortMenu: props => (
        <SortMenu {...props} variant="creation" initialSort="createdAt;-1" />
      ),
      filterMenu: ProfileCreationsFilter,
      content: (
        <CreationsFeed
          ref={creationsFeedRef}
          // For agent profiles we passed agent id in baseQuery.
          // Other feeds below still rely on user id semantics.
          query={baseQuery}
          maxCols={7}
          multiselect={isOwnProfile}
          onNavigate={handleCreationNavigation}
        />
      ),
      actionButton: isOwnProfile ? (
        <Button asChild size="lg" className="gap-2">
          <Link href="/create/image/flux_dev">
            <Plus className="h-4 w-4" />
            Create an Image
          </Link>
        </Button>
      ) : undefined,
    },
    {
      key: 'models',
      title: 'Models',
      filterMenu: ProfileModelsFilter,
      // sortMenu: props => (
      //   <SortMenu {...props} variant="model" initialSort="createdAt;-1" />
      // ),
      content: (
        <ModelsFeed query={{ user: creator._id }} minCols={1} maxCols={4} />
      ),
      actionButton: isOwnProfile ? (
        <Button asChild size="lg" className="gap-2">
          <Link href="/train/flux_trainer">
            <LightningBoltIcon className="h-4 w-4" />
            Train Model
          </Link>
        </Button>
      ) : undefined,
    },
    {
      key: 'collections',
      title: 'Collections',
      filterMenu: ProfileCollectionsFilter,
      content: <CollectionsFeed query={{ user: creator._id }} />,
    },
    {
      key: 'agents',
      title: 'My Agents',
      filterMenu: ProfileAgentsFilter,
      canSearch: true,
      sortMenu: props => <SortMenu {...props} variant="agent" />,
      actionButton: isOwnProfile ? (
        <Button asChild size="lg" className="gap-2">
          <Link href="/new/agent">
            <Plus className="h-4 w-4" />
            Create Agent
          </Link>
        </Button>
      ) : undefined,
      content: (
        <AgentsFeed
          query={{ user: creator._id }}
          minCols={1}
          maxCols={5}
          hideCreateButton={true}
          improvedLayout={true}
          hideContextMenu={true}
          breakpoints={[
            { minWidth: 1536, columns: 5 },
            { minWidth: 1280, columns: 4 },
            { minWidth: 1024, columns: 3 },
            { minWidth: 768, columns: 2 },
            { minWidth: 640, columns: 2 },
            { minWidth: 0, columns: 1 },
          ]}
        />
      ),
    },
    ...(isOwnProfile && isPreviewUser
      ? [
          {
            key: 'shared-agents',
            title: 'Shared Agents',
            content: <SharedAgentsSection />,
          },
        ]
      : []),
  ]

  return <RouterTabs tabs={tabs} baseQuery={baseQuery} />
}

export default ProfileTabs
