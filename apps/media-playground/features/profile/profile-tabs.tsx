'use client'

import RouterTabs from '@/components/tabs/router-tabs'
import UserCreationsFeed from '@/features/feed/user-creations-feed'
import UserModelsFeed from '@/features/feed/user-models-feed'
import { useParams } from 'next/navigation'

const ProfileTabs = () => {
  const params = useParams<{ name: string }>()
  const tabs = [
    {
      key: 'creations',
      title: 'Creations',
      content: <UserCreationsFeed userName={params.name} maxCols={7} />,
    },
    {
      key: 'models',
      title: 'Models',
      content: (
        <UserModelsFeed userName={params.name} minCols={1} maxCols={4} />
      ),
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
