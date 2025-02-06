'use client'

import { Button } from '../ui/button'
import { MasonrySkeleton } from '@/components/masonry/masonry-virtualizer-vertical'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { FeedCursorRouteQueryParams } from '@edenlabs/eden-sdk'
import debounce from 'lodash/debounce'
import { SearchIcon, XIcon } from 'lucide-react'
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
  const [searchInput, setSearchInput] = useState('')

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

  // const handleTabSortChange = (sort: string) => {
  //   setTabFilterQuery(prevQuery => {
  //     return {
  //       ...prevQuery,
  //       sort,
  //     }
  //   })

  //   // Invalidate cache for active tab since the tab-specific filter changed
  //   setTabCaches(prevCache => {
  //     const updatedCache = { ...prevCache }
  //     delete updatedCache[activeTab]
  //     return updatedCache
  //   })
  // }

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

  const debouncedSearch = useMemo(
    () => debounce((value: string) => handleSearch(value), 500),
    [activeTab], // Recreate debounced function when tab changes
  )

  const handleSearchInput = (value: string) => {
    setSearchInput(value)
    debouncedSearch(value)
  }

  const handleSearchReset = () => {
    setSearchInput('')
    setSearch('')
    handleSearch('')
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
      <div className="flex flex-col md:flex-row gap-4 w-full mb-4">
        <TabsList className="flex justify-stretch min-w-[328px] w-full md:w-auto md:min-w-[420px]">
          {tabs.map(tab => (
            <TabsTrigger key={tab.key} value={tab.key} className="w-full">
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex gap-4">
          {activeRouterTab?.sortMenu || activeRouterTab?.filterMenu ? (
            <Separator orientation="vertical" className="hidden md:block" />
          ) : null}

          {activeRouterTab?.filterMenu ? (
            <div className="flex-1">
              <activeRouterTab.filterMenu
                initialFilter={
                  activeRouterTab.initialFilter ||
                  tabCaches[activeTab]?.filterQuery
                }
                onChange={handleTabFilterChange}
              />
            </div>
          ) : null}

          {/* {activeRouterTab?.sortMenu ? (
            <div className="flex-1">
              <activeRouterTab.sortMenu
                initialSort={tabCaches[activeTab]?.filterQuery?.sort as string}
                onChange={handleTabSortChange}
              />
            </div>
          ) : null} */}

          {sharedFilterMenu ? (
            <div className="flex gap-4">
              <Separator orientation="vertical" className="hidden md:block" />
              {sharedFilterMenu({
                initialFilter: baseQuery,
                onChange: handleGlobalFilterChange,
              })}
            </div>
          ) : null}

          {activeRouterTab?.canSearch ? (
            <div className="flex items-center mb-4 md:mb-0 w-full">
              <div className="shrink-0 border rounded-l-md size-10 items-center justify-center flex bg-muted/40 md:ml-auto">
                <SearchIcon className="w-4 h-4" />
              </div>
              <Input
                className="rounded-none border-l-transparent border-r-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-purple-600/40"
                placeholder="Search"
                value={searchInput}
                onChange={e => handleSearchInput(e.target.value)}
              />
              <Button
                variant="outline"
                size="icon"
                className={cn(['rounded-l-none bg-muted/40'])}
                onClick={handleSearchReset}
                disabled={!searchInput}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {tabs.map(tab => (
        <TabsContent key={tab.key} value={tab.key}>
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
