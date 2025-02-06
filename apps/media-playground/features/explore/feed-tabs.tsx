'use client'

import RouterTabs, { RouterTab } from '@/components/tabs/router-tabs'
import AgentsFeed from '@/features/feed/agents-feed'
import CreationsFeed from '@/features/feed/creations-feed'
import { CreationsFilter } from '@/features/feed/creations-filter'
import ModelsFeed from '@/features/feed/models-feed'
import { ModelsFilter } from '@/features/feed/models-filter'
import { SortMenu } from '@/features/feed/sort-menu'

const FeedTabs = () => {
  // Define initial filter for creations tab
  const initialCreationsFilter = {
    collection: process.env.NEXT_PUBLIC_EDEN_FEATURED_COLLECTION_ID,
  }

  const tabs: RouterTab[] = [
    {
      key: 'creations',
      title: 'Creations',
      content: <CreationsFeed maxCols={7} />,
      sortMenu: SortMenu,
      filterMenu: CreationsFilter,
      initialFilter: initialCreationsFilter,
    },
    {
      key: 'models',
      title: 'Models',
      content: (
        <ModelsFeed
          minCols={1}
          maxCols={5}
          breakpoints={[
            { minWidth: 1536, columns: 5 },
            { minWidth: 1280, columns: 4 },
            { minWidth: 640, columns: 2 },
            { minWidth: 0, columns: 1 },
          ]}
        />
      ),
      filterMenu: ModelsFilter,
    },
    {
      key: 'agents',
      title: 'Agents',
      canSearch: true,
      content: (
        <AgentsFeed
          minCols={1}
          maxCols={3}
          breakpoints={[
            { minWidth: 1280, columns: 3 },
            { minWidth: 640, columns: 2 },
            { minWidth: 0, columns: 1 },
          ]}
        />
      ),
    },
  ]

  return <RouterTabs tabs={tabs} />
}

export default FeedTabs
