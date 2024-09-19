'use client'

import RouterTabs from '@/components/tabs/router-tabs'
import CreationsFeed from '@/features/feed/creations-feed'
import ModelsFeed from '@/features/feed/models-feed'
import { useCreatorQuery } from '@/hooks/query/use-creator-query'
import { useParams } from 'next/navigation'

const ProfileTabs = () => {
  const params = useParams<{ name: string }>()
  const { creator } = useCreatorQuery({ key: params.name })

  const tabs = [
    {
      key: 'creations',
      title: 'Creations',
      content: creator ? (
        <CreationsFeed
          query={{ user: creator._id }}
          maxCols={7}
          multiselect={true}
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
    // {
    //   key: 'collections',
    //   title: 'Collections',
    //   content: <div>collections</div>,
    // },
  ]

  return <RouterTabs tabs={tabs} />
}

export default ProfileTabs
