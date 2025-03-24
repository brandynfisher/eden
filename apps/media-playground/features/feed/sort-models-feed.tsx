'use client'

import FeedSearchForm from '@/components/filter/feed-search-form'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import ModelsFeed from '@/features/feed/models-feed'
import { ModelsFilter } from '@/features/feed/models-filter'
import {
  FeedConceptsCursorArguments,
  FeedCursorRouteQueryParams,
} from '@edenlabs/eden-sdk'
import { useState } from 'react'

type Props = {
  initialSort?: string
  initialFilter?: FeedCursorRouteQueryParams['filter']
}

const SortModelsFeed = ({ initialFilter }: Props) => {
  // const [sort, setSort] = useState(initialSort || 'createdAt;-1')
  const [filter, setFilter] = useState<FeedCursorRouteQueryParams['filter']>(
    initialFilter || {},
  )
  const [search, setSearch] = useState('')
  const handleSearch = (value: string) => {
    setSearch(value)
  }

  // Convert filter object to query parameters for ModelsFeed
  const getQueryParams = (): FeedConceptsCursorArguments => {
    const queryParams: FeedConceptsCursorArguments = {
      sort: ['createdAt;-1'],
      search: search,
    }

    // Convert filter object properties to string array format
    if (filter && Object.keys(filter).length > 0) {
      const filterStrings: string[] = []

      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => filterStrings.push(`${key}:${v}`))
          } else {
            filterStrings.push(`${key}:${value}`)
          }
        }
      })

      if (filterStrings.length > 0) {
        queryParams.filter = filterStrings
      }
    }

    return queryParams
  }

  return (
    <>
      <div className="flex items-center mb-6 gap-x-2">
        <div className="flex items-center justify-between mr-auto">
          <TypographyH4 className="text-xl font-semibold text-center">
            Explore Models
          </TypographyH4>
        </div>
        <FeedSearchForm handleSearch={handleSearch} />
        <ModelsFilter
          initialFilter={initialFilter}
          onChange={filter => setFilter(filter)}
        />
      </div>
      <ModelsFeed query={getQueryParams()} minCols={1} maxCols={5} />
    </>
  )
}

export default SortModelsFeed
