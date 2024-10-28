'use client'

import RouterTabs, { RouterTab } from '@/components/tabs/router-tabs'
import CreationsFeed from '@/features/feed/creations-feed'
import ModelsFeed from '@/features/feed/models-feed'
import { ClockArrowDownIcon, StarIcon } from 'lucide-react'

const FeedTabs = () => {
  // Define a base query for the initial state to prevent any unfiltered requests
  const creationsBaseQuery = {
    collection: '670a7250ff7f3809e9b380bf', // @todo: pull from config per ENV
  }

  // Define the tabs with filter options, ensuring we start with a consistent query
  const tabs: RouterTab[] = [
    {
      key: 'creations',
      title: 'Creations',
      content: <CreationsFeed query={creationsBaseQuery} maxCols={7} />,
      filterOptions: [
        {
          label: 'Featured',
          value: 'featured',
          icon: <StarIcon className="h-3 w-3 mr-2" />,
          query: creationsBaseQuery,
        },
        {
          label: 'Latest',
          value: 'latest',
          icon: <ClockArrowDownIcon className="h-3 w-3 mr-2" />,
          query: {},
        },
      ],
    },
    {
      key: 'models',
      title: 'Models',
      content: <ModelsFeed minCols={1} maxCols={4} />, // No base query for models, just an empty query to ensure it doesn't issue unfiltered requests
    },
  ]

  // Render RouterTabs, no separate loading state is needed
  return <RouterTabs tabs={tabs} />
}

export default FeedTabs
