'use client'

import FeedSearchForm from '@/components/filter/feed-search-form'
import { MasonrySkeleton } from '@/components/masonry/masonry-virtualizer-vertical'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollContainerProvider } from '@/contexts/scroll-container-context'
import { FeedCursorRouteQueryParams } from '@edenlabs/eden-sdk'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  ReactElement,
  cloneElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

export type FilterMenuProps = {
  initialFilter?: FeedCursorRouteQueryParams['filter']
  onChange: (filter: FeedCursorRouteQueryParams['filter']) => void
  excludeFromCount?: string[]
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
  actionButton?: ReactElement
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
  const initialTab = searchParams?.get('tab') || defaultTabName
  const [activeTab, setActiveTab] = useState(initialTab)
  const [search, setSearch] = useState('')
  const [isTabChanging, setIsTabChanging] = useState(false)
  const tabChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentScrollRef = useRef<HTMLDivElement>(null)

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

  const [tabCaches, setTabCaches] = useState<{
    [key: string]: {
      filterQuery: FeedCursorRouteQueryParams['filter']
      fingerprint: string
      content: ReactElement
    }
  }>({})

  // Combine filters with proper memoization
  const combinedQuery = useMemo(() => {
    return {
      ...globalFilterQuery,
      ...tabFilterQuery,
      search,
    }
  }, [globalFilterQuery, tabFilterQuery, search])

  // Stable query key for cache management
  const queryFingerprint = useMemo(() => {
    return JSON.stringify(combinedQuery)
  }, [combinedQuery])

  const handleTabChange = (value: string) => {
    if (value === activeTab) return
    // Clear any existing timeout
    if (tabChangeTimeoutRef.current) {
      clearTimeout(tabChangeTimeoutRef.current)
    }

    // Show loading state during tab transition
    setIsTabChanging(true)

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

    // Hide loading state after brief delay to prevent flicker
    tabChangeTimeoutRef.current = setTimeout(() => {
      setIsTabChanging(false)
    }, 150)
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
    const tab = tabs.find(t => t.key === activeTab)
    if (!tab) return

    // Only update cache if query has actually changed
    const currentCache = tabCaches[activeTab]
    const currentFingerprint = currentCache?.fingerprint

    if (currentFingerprint !== queryFingerprint) {
      setTabCaches(prevCache => ({
        ...prevCache,
        [activeTab]: {
          filterQuery: combinedQuery,
          fingerprint: queryFingerprint,
          content: cloneElement(tab.content, { query: combinedQuery }),
        },
      }))
    }
  }, [activeTab, queryFingerprint, tabs])

  useEffect(() => {
    // Update activeTab when search params change (e.g., external navigation)
    setActiveTab(initialTab)
  }, [initialTab])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tabChangeTimeoutRef.current) {
        clearTimeout(tabChangeTimeoutRef.current)
      }
    }
  }, [])

  const activeRouterTab = useMemo(() => {
    return tabs.find(tab => tab.key === activeTab)
  }, [tabs, activeTab])

  return (
    <ScrollContainerProvider value={contentScrollRef}>
      <div className="flex flex-col min-h-0 w-full max-w-full">
        <div
          ref={contentScrollRef}
          className="w-full min-h-0 flex-1 overflow-y-auto"
          style={{ height: 'calc(100vh - 200px)' }}
        >
          <Tabs
            value={activeTab}
            defaultValue={defaultTabName}
            onValueChange={handleTabChange}
            className="flex flex-col min-h-0 w-full max-w-full"
          >
            <div className="flex flex-wrap flex-col sm:flex-row gap-4 w-full mb-4 sm:justify-between">
              <div className="flex flex-wrap flex-col sm:flex-row gap-4 flex-1">
                {/* Mobile: Use Select when there are 4+ tabs */}
                {tabs.length >= 4 ? (
                  <>
                    <Select value={activeTab} onValueChange={handleTabChange}>
                      <SelectTrigger className="w-full sm:hidden">
                        <SelectValue>
                          {tabs.find(tab => tab.key === activeTab)?.title}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {tabs.map(tab => (
                          <SelectItem key={tab.key} value={tab.key}>
                            {tab.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* Desktop: Keep original TabsList */}
                    <TabsList className="hidden sm:flex justify-stretch w-auto min-w-[420px]">
                      {tabs.map(tab => (
                        <TabsTrigger
                          key={tab.key}
                          value={tab.key}
                          className="flex-1 min-w-fit whitespace-nowrap"
                        >
                          {tab.title}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </>
                ) : (
                  /* Use TabsList for both mobile and desktop when 3 or fewer tabs */
                  <TabsList className="flex justify-stretch w-full md:w-auto md:min-w-[420px] overflow-x-auto">
                    {tabs.map(tab => (
                      <TabsTrigger
                        key={tab.key}
                        value={tab.key}
                        className="flex-1 min-w-fit whitespace-nowrap"
                      >
                        {tab.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                )}

                {activeRouterTab?.filterMenu ? (
                  <activeRouterTab.filterMenu
                    initialFilter={
                      activeRouterTab.initialFilter ||
                      tabCaches[activeTab]?.filterQuery
                    }
                    onChange={handleTabFilterChange}
                    excludeFromCount={baseQuery ? Object.keys(baseQuery) : []}
                  />
                ) : null}

                {activeRouterTab?.sortMenu ? (
                  <activeRouterTab.sortMenu
                    initialSort={
                      tabCaches[activeTab]?.filterQuery?.sort as string
                    }
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

              {activeRouterTab?.actionButton && (
                <div className="flex-shrink-0">
                  {activeRouterTab.actionButton}
                </div>
              )}
            </div>

            {tabs.map(tab => (
              <TabsContent
                key={tab.key}
                value={tab.key}
                className="!ring-0 !ring-offset-0"
              >
                {isTabChanging || !tabCaches[tab.key] ? (
                  <MasonrySkeleton />
                ) : (
                  tabCaches[tab.key].content
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </ScrollContainerProvider>
  )
}

export default RouterTabs
