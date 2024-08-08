'use client'

import RouterTabs from '@/components/tabs/router-tabs'
import UserCreationsFeed from '@/components/user-creations-feed'
import { useParams } from 'next/navigation'

const ProfileTabs = () => {
  const params = useParams<{ name: string }>()
  const tabs = [
    {
      key: 'creations',
      title: 'Creations',
      content: <UserCreationsFeed userName={params.name} />,
    },
    {
      key: 'models',
      title: 'Models',
      content: <div>models</div>,
    },
    {
      key: 'collections',
      title: 'Collections',
      content: <div>collections</div>,
    },
  ]

  return <RouterTabs tabs={tabs} />
}

export default ProfileTabs
