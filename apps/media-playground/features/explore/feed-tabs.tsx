'use client'

import RouterTabs, { RouterTab } from '@/components/tabs/router-tabs'
import AgentsFeed from '@/features/feed/agents-feed'
import CreationsFeed from '@/features/feed/creations-feed'
import ModelsFeed from '@/features/feed/models-feed'
import { ClockArrowDownIcon, StarIcon } from 'lucide-react'

const FeedTabs = () => {
  // Define a base query for the initial state to prevent any unfiltered requests
  const creationsBaseQuery = process.env.NEXT_PUBLIC_EDEN_FEATURED_COLLECTION_ID
    ? {
        collection: process.env.NEXT_PUBLIC_EDEN_FEATURED_COLLECTION_ID,
      }
    : undefined

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
    {
      key: 'agents',
      title: 'Agents',
      content: <AgentsFeed minCols={1} maxCols={4} />,
    },
  ]

  // Render RouterTabs, no separate loading state is needed
  return <RouterTabs tabs={tabs} />
}

export default FeedTabs
