'use client'

import RouterTabs, { RouterTab } from '@/components/tabs/router-tabs'
import { Button } from '@/components/ui/button'
import CollectionsFeed from '@/features/feed/collections-feed'
import CreationsFeed from '@/features/feed/creations-feed'
import ModelsFeed from '@/features/feed/models-feed'
import { SortMenu } from '@/features/feed/sort-menu'
import { ProfileAgentsFilter } from '@/features/profile/profile-agents-filter'
import ProfileAgentsSimple from '@/features/profile/profile-agents-simple'
import { ProfileCollectionsFilter } from '@/features/profile/profile-collections-filter'
import { ProfileCreationsFilter } from '@/features/profile/profile-creations-filter'
import { ProfileModelsFilter } from '@/features/profile/profile-models-filter'
import { SharedAgentsSection } from '@/features/profile/shared-agents-section'
import { useCreatorQuery } from '@/hooks/query/use-creator-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { hasPreviewAccess } from '@/hooks/use-gated-resource'
import { useMe } from '@/hooks/use-me'
import { Creator } from '@edenlabs/eden-sdk'
import { LightningBoltIcon } from '@radix-ui/react-icons'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ReactElement } from 'react'

// Extended Creator type with optional count fields from API
type CreatorWithCounts = Creator & {
  likedCreationsCount?: number
}

type ProfileTabsProps = {
  header?: ReactElement
}

const ProfileTabs = ({ header }: ProfileTabsProps) => {
  const params = useParams<{ name: string }>()
  const { user, isSignedIn } = useAuthState()
  const { creator } = useCreatorQuery({ key: params?.name })
  const { user: meUser } = useMe({ isAuthenticated: !!isSignedIn })
  // NOTE: We intentionally place all hooks (useEffect/useCallback/etc.) before
  // any conditional returns to avoid changing the number/order of hooks between renders.

  const isOwnProfile = creator ? user?._id === creator._id : false
  const isPreviewUser = hasPreviewAccess(meUser?.featureFlags)

  // Determine default sort: show "Latest" if profile has fewer than 20 liked creations
  const likedCreationsCount =
    (creator as CreatorWithCounts)?.likedCreationsCount ?? 0
  const defaultSort =
    isOwnProfile || likedCreationsCount < 20
      ? 'createdAt;-1'
      : 'likeCount|createdAt;-1'

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
      initialSort: defaultSort,
      sortMenu: props => (
        <SortMenu {...props} variant="creation" initialSort={defaultSort} />
      ),
      filterMenu: ProfileCreationsFilter,
      canSearch: true,
      content: (
        <CreationsFeed
          // For agent profiles we passed agent id in baseQuery.
          // Other feeds below still rely on user id semantics.
          query={baseQuery}
          maxCols={7}
          multiselect={isOwnProfile}
          debugLabel={`profile/creations:${creator.username || creator._id}`}
        />
      ),
      actionButton: isOwnProfile ? (
        <Button asChild size="lg" className="gap-2">
          <Link href="/studio/image/flux_dev">
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
          <Link href="/studio/lora/flux_trainer">
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
      title: isOwnProfile ? 'My Agents' : 'Agents',
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
      content: <ProfileAgentsSimple userId={creator._id} />,
    },
    ...(isOwnProfile && isPreviewUser
      ? [
          {
            key: 'shared-agents',
            title: 'Shared Agents',
            canSearch: true,
            content: <SharedAgentsSection />,
          },
        ]
      : []),
  ]

  return <RouterTabs tabs={tabs} baseQuery={baseQuery} header={header} />
}

export default ProfileTabs
