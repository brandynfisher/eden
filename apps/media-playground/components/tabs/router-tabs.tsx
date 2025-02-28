'use client'

import FeedSearchForm from '@/components/filter/feed-search-form'
import { MasonrySkeleton } from '@/components/masonry/masonry-virtualizer-vertical'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FeedCursorRouteQueryParams } from '@edenlabs/eden-sdk'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ReactElement, cloneElement, useEffect, useMemo, useState } from 'react'

export type FilterMenuProps = {
  initialFilter?: FeedCursorRouteQueryParams['filter']
  onChange: (filter: FeedCursorRouteQueryParams['filter']) => void
}

export type SortMenuProps = {
  initialSort?: string
  onChange: (sort: string) => void
}

export type RouterTab = {
  key: string
  title: string
  content: ReactElement
  filterMenu?: (props: FilterMenuProps) => ReactElement
  sortMenu?: (props: SortMenuProps) => ReactElement
  canSearch?: boolean
  initialFilter?: FeedCursorRouteQueryParams['filter']
}

type Props = {
  tabs: RouterTab[]
  sharedFilterMenu?: (props: FilterMenuProps) => ReactElement
  baseQuery?: FeedCursorRouteQueryParams['filter']
}

const RouterTabs = ({ tabs, sharedFilterMenu, baseQuery }: Props) => {
  const defaultTabName = tabs[0].key

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTab = searchParams.get('tab') || defaultTabName
  const [activeTab, setActiveTab] = useState(initialTab)
  const [search, setSearch] = useState('')

  const [tabCaches, setTabCaches] = useState<{
    [key: string]: {
      filterQuery: FeedCursorRouteQueryParams['filter']
      content: ReactElement
    }
  }>({})

  // Filters management
  const [globalFilterQuery, setGlobalFilterQuery] = useState<
    FeedCursorRouteQueryParams['filter'] | undefined
  >(baseQuery || {})
  const [tabFilterQuery, setTabFilterQuery] = useState<
    FeedCursorRouteQueryParams['filter'] | undefined
  >(() => {
    const activeTab = tabs.find(t => t.key === initialTab)
    return activeTab?.initialFilter || baseQuery || {}
  })

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (search) {
      setSearch('')
      setTabCaches(prevCache => {
        const updatedCache = { ...prevCache }
        delete updatedCache[activeTab]
        return updatedCache
      })
    }

    // Reset tab-specific filters when changing tabs
    const newTab = tabs.find(t => t.key === value)
    setTabFilterQuery(newTab?.initialFilter || {})

    // Update router URL for tab change without triggering content rerender yet
    router.push(`${pathname}${value === defaultTabName ? '' : `?tab=${value}`}`)
  }

  const handleGlobalFilterChange = (
    filter: FeedCursorRouteQueryParams['filter'],
  ) => {
    setGlobalFilterQuery(filter)

    // Invalidate cache for all tabs since the global filter changed
    setTabCaches({})
  }

  const handleTabFilterChange = (
    filter: FeedCursorRouteQueryParams['filter'],
  ) => {
    setTabFilterQuery(prevQuery => {
      return {
        ...prevQuery,
        ...filter,
      }
    })

    // Invalidate cache for active tab since the tab-specific filter changed
    setTabCaches(prevCache => {
      const updatedCache = { ...prevCache }
      delete updatedCache[activeTab]
      return updatedCache
    })
  }

  const handleTabSortChange = (sort: string) => {
    setTabFilterQuery(prevQuery => {
      return {
        ...prevQuery,
        sort,
      }
    })

    // Invalidate cache for active tab since the tab-specific filter changed
    setTabCaches(prevCache => {
      const updatedCache = { ...prevCache }
      delete updatedCache[activeTab]
      return updatedCache
    })
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setTabFilterQuery(prevQuery => {
      return {
        ...prevQuery,
        search: value,
      }
    })

    // Invalidate cache for active tab since the tab-specific filter changed
    setTabCaches(prevCache => {
      const updatedCache = { ...prevCache }
      delete updatedCache[activeTab]
      return updatedCache
    })
  }

  useEffect(() => {
    // Ensure that caching occurs only when filters are fully ready and content is rendered
    const tab = tabs.find(t => t.key === activeTab)
    if (tab) {
      const updatedQuery = {
        ...globalFilterQuery,
        ...tabFilterQuery,
        search,
      }

      if (!tabCaches[activeTab]) {
        setTabCaches(prevCache => ({
          ...prevCache,
          [activeTab]: {
            filterQuery: updatedQuery,
            content: cloneElement(tab.content, { query: updatedQuery }),
          },
        }))
      }
    }
  }, [activeTab, globalFilterQuery, tabFilterQuery, tabs])

  useEffect(() => {
    // Update activeTab when search params change (e.g., external navigation)
    setActiveTab(initialTab)
  }, [initialTab])

  const activeRouterTab = useMemo(() => {
    return tabs.find(tab => tab.key === activeTab)
  }, [tabs, activeTab])

  return (
    <Tabs
      value={activeTab}
      defaultValue={defaultTabName}
      onValueChange={handleTabChange}
      className="w-full max-w-full"
    >
      <div className="flex flex-wrap flex-col sm:flex-row gap-4 w-full mb-4">
        <TabsList className="flex justify-stretch min-w-[328px] w-full md:w-auto md:min-w-[420px]">
          {tabs.map(tab => (
            <TabsTrigger key={tab.key} value={tab.key} className="w-full">
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {activeRouterTab?.filterMenu ? (
          <activeRouterTab.filterMenu
            initialFilter={
              activeRouterTab.initialFilter || tabCaches[activeTab]?.filterQuery
            }
            onChange={handleTabFilterChange}
          />
        ) : null}

        {activeRouterTab?.sortMenu ? (
          <activeRouterTab.sortMenu
            initialSort={tabCaches[activeTab]?.filterQuery?.sort as string}
            onChange={handleTabSortChange}
          />
        ) : null}

        {sharedFilterMenu
          ? sharedFilterMenu({
              initialFilter: baseQuery,
              onChange: handleGlobalFilterChange,
            })
          : null}

        {activeRouterTab?.canSearch ? (
          <FeedSearchForm handleSearch={handleSearch} />
        ) : null}
      </div>

      {tabs.map(tab => (
        <TabsContent
          key={tab.key}
          value={tab.key}
          className="!ring-0 !ring-offset-0"
        >
          {tabCaches[tab.key] ? (
            // Render cached content if available
            tabCaches[tab.key].content
          ) : (
            // Show loading indicator until the content is properly cached
            <MasonrySkeleton />
          )}
        </TabsContent>
      ))}
    </Tabs>
  )
}

export default RouterTabs
