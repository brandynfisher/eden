'use client'

// import { SortMenu } from '@/features/feed/sort-menu'
// import { useState } from 'react'
import { Button } from '@/components/ui/button'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import ModelsFeed from '@/features/feed/models-feed'
import { ModelsFilter } from '@/features/feed/models-filter'
import {
  FeedConceptsCursorArguments,
  FeedCursorRouteQueryParams,
} from '@edenlabs/eden-sdk'
import { ChevronRight } from 'lucide-react'
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

  // Convert filter object to query parameters for ModelsFeed
  const getQueryParams = (): FeedConceptsCursorArguments => {
    const queryParams: FeedConceptsCursorArguments = {
      sort: ['createdAt;-1'],
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
        <div className="flex items-center justify-between">
          <TypographyH4 className="text-xl font-semibold text-center">
            Explore Models
          </TypographyH4>
        </div>
        {/* <SortMenu className='ml-auto' variant="agent" initialSort={initialSort} onChange={(sort) => setSort(sort)} /> */}
        <ModelsFilter
          className="ml-auto"
          initialFilter={initialFilter}
          onChange={filter => setFilter(filter)}
        />
        <Button
          variant="outline"
          className="gap-x-2 text-sm font-semibold bg-purple-600/40 hover:bg-purple-600/20 border-purple-600/60 hover:border-purple-600"
        >
          More
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <ModelsFeed query={getQueryParams()} minCols={1} maxCols={5} />
    </>
  )
}

export default SortModelsFeed
