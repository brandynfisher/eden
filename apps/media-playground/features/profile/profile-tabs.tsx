'use client'

import RouterTabs, { RouterTab } from '@/components/tabs/router-tabs'
import AgentsFeed from '@/features/feed/agents-feed'
import CollectionsFeed from '@/features/feed/collections-feed'
import CreationsFeed from '@/features/feed/creations-feed'
import ModelsFeed from '@/features/feed/models-feed'
import { SortMenu } from '@/features/feed/sort-menu'
import { ProfileAgentsFilter } from '@/features/profile/profile-agents-filter'
import { ProfileCollectionsFilter } from '@/features/profile/profile-collections-filter'
import { ProfileCreationsFilter } from '@/features/profile/profile-creations-filter'
import { ProfileModelsFilter } from '@/features/profile/profile-models-filter'
import { useCreatorQuery } from '@/hooks/query/use-creator-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { useParams } from 'next/navigation'

const ProfileTabs = () => {
  const params = useParams<{ name: string }>()
  const { user, isSignedIn } = useAuthState()
  const { creator } = useCreatorQuery({ key: params.name })

  if (!creator || (isSignedIn && !user)) {
    return null
  }

  const baseQuery = {
    user: creator._id,
    agent: creator?._id,
  }

  const isOwnProfile = user?._id === creator._id

  const tabs: RouterTab[] = [
    {
      key: 'creations',
      title: 'Creations',
      filterMenu: ProfileCreationsFilter,
      content: (
        <CreationsFeed
          query={baseQuery}
          maxCols={7}
          multiselect={isOwnProfile}
        />
      ),
    },
    {
      key: 'models',
      title: 'Models',
      filterMenu: ProfileModelsFilter,
      content: <ModelsFeed query={baseQuery} minCols={1} maxCols={4} />,
    },
    {
      key: 'collections',
      title: 'Collections',
      filterMenu: ProfileCollectionsFilter,
      content: <CollectionsFeed query={baseQuery} />,
    },
    {
      key: 'agents',
      title: 'Agents',
      filterMenu: ProfileAgentsFilter,
      canSearch: true,
      sortMenu: props => <SortMenu {...props} variant="agent" />,
      content: (
        <AgentsFeed
          query={baseQuery}
          minCols={1}
          maxCols={3}
          breakpoints={[
            { minWidth: 1536, columns: 4 },
            { minWidth: 1280, columns: 3 },
            { minWidth: 640, columns: 2 },
            { minWidth: 0, columns: 1 },
          ]}
        />
      ),
    },
  ]

  return <RouterTabs tabs={tabs} baseQuery={baseQuery} />
}

export default ProfileTabs
