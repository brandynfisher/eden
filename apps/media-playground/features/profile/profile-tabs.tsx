'use client'

import RouterTabs from '@/components/tabs/router-tabs'
import AssistantsFeed from '@/features/feed/assistants-feed'
import CollectionsFeed from '@/features/feed/collections-feed'
import CreationsFeed from '@/features/feed/creations-feed'
import ModelsFeed from '@/features/feed/models-feed'
import { useCreatorQuery } from '@/hooks/query/use-creator-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { useParams } from 'next/navigation'

const ProfileTabs = () => {
  const params = useParams<{ name: string }>()
  const { user, hasAssistantAccess } = useAuthState()
  const { creator } = useCreatorQuery({ key: params.name })

  const tabs = [
    {
      key: 'creations',
      title: 'Creations',
      content: creator ? (
        <CreationsFeed
          query={{ user: creator._id }}
          maxCols={7}
          multiselect={user?._id === creator._id}
        />
      ) : null,
    },
    {
      key: 'models',
      title: 'Models',
      content: creator ? (
        <ModelsFeed query={{ user: creator._id }} minCols={1} maxCols={4} />
      ) : null,
    },
    {
      key: 'collections',
      title: 'Collections',
      content: creator ? (
        <CollectionsFeed query={{ user: creator._id }} />
      ) : null,
    },
  ]

  if (hasAssistantAccess) {
    tabs.push({
      key: 'assistants',
      title: 'Assistants',
      content: creator ? (
        <AssistantsFeed query={{ user: creator._id }} />
      ) : null,
    })
  }

  return <RouterTabs tabs={tabs} />
}

export default ProfileTabs
