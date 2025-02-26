'use client'

import FeedSearchForm from '@/components/filter/feed-search-form'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import AgentsFeed from '@/features/feed/agents-feed'
import { SortMenu } from '@/features/feed/sort-menu'
import { useState } from 'react'

type Props = {
  initialSort?: string
}

const SortAgentsFeed = ({ initialSort }: Props) => {
  const [sort, setSort] = useState(initialSort || 'createdAt;-1')
  const [search, setSearch] = useState('')
  const handleSearch = (value: string) => {
    setSearch(value)
  }

  const query = {
    sort: sort,
    search: search,
  }

  return (
    <>
      <div className="flex flex-wrap items-center mb-6 gap-2">
        <div className="flex items-center justify-between mr-auto">
          <TypographyH4 className="text-2xl font-semibold text-center">
            Explore Agents
          </TypographyH4>
        </div>
        <FeedSearchForm handleSearch={handleSearch} />
        <SortMenu
          variant="agent"
          initialSort={initialSort}
          onChange={sort => setSort(sort)}
        />
      </div>

      <AgentsFeed
        query={query}
        hideCreateButton={true}
        minCols={1}
        maxCols={3}
        breakpoints={[
          { minWidth: 1536, columns: 4 },
          { minWidth: 1280, columns: 3 },
          { minWidth: 640, columns: 2 },
          { minWidth: 0, columns: 1 },
        ]}
      />
    </>
  )
}

export default SortAgentsFeed
