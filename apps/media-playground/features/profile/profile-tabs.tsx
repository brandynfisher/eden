'use client'

import RouterTabs, { RouterTab } from '@/components/tabs/router-tabs'
import { Button } from '@/components/ui/button'
import AgentsFeed from '@/features/feed/agents-feed'
import CollectionsFeed from '@/features/feed/collections-feed'
import CreationsFeed from '@/features/feed/creations-feed'
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

const ProfileTabs = () => {
  const params = useParams<{ name: string }>()
  const { user, isSignedIn } = useAuthState()
  const { creator } = useCreatorQuery({ key: params?.name })
  const { user: meUser } = useMe({ isAuthenticated: !!isSignedIn })

  if (!creator || (isSignedIn && !user)) {
    return null
  }

  const baseQuery = {
    user: creator._id,
  }

  const isOwnProfile = user?._id === creator._id
  const isPreviewUser = meUser?.featureFlags?.includes(FeatureFlag.Preview)

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
          query={baseQuery}
          maxCols={7}
          multiselect={isOwnProfile}
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
      content: <ModelsFeed query={baseQuery} minCols={1} maxCols={4} />,
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
      content: <CollectionsFeed query={baseQuery} />,
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
          query={baseQuery}
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
    ...(isOwnProfile && isPreviewUser ? [{
      key: 'shared-agents',
      title: 'Shared Agents',
      content: <SharedAgentsSection />,
    }] : []),
  ]

  return <RouterTabs tabs={tabs} baseQuery={baseQuery} />
}

export default ProfileTabs
