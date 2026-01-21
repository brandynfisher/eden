'use client'

import CollectionCard from '@/components/card/collection-card'
import FeedSearchForm from '@/components/filter/feed-search-form'
import { useAppShell } from '@/components/layout/app-shell'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FeaturedCollections } from '@/features/collections/featured-collections'
import { useAuthState } from '@/hooks/use-auth-state'
import { createCursorPaginationRoute, fetcher } from '@/lib/fetcher'
import {
  CollectionV2,
  FeedCollectionsV2CursorArguments,
} from '@edenlabs/eden-sdk'
import { useQuery } from '@tanstack/react-query'
import { MenuIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type CollectionScope = 'mine' | 'public'
type CollectionSortOption = 'latest' | 'popular'

const sortOptions: {
  value: CollectionSortOption
  label: string
  sort: string[]
}[] = [
  { value: 'latest', label: 'Latest', sort: ['createdAt;-1'] },
  { value: 'popular', label: 'Popular', sort: ['creationCount;-1'] },
]

const CollectionsPage = () => {
  const { openMobileSidebar, setConfig, resetConfig } = useAppShell()
  const { user, isLoading: isAuthLoading, isSignedIn } = useAuthState()

  const [searchInputValue, setSearchInputValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [scope, setScope] = useState<CollectionScope>('public')
  const [sortOption, setSortOption] = useState<CollectionSortOption>('latest')
  const [hasMounted, setHasMounted] = useState(false)

  const currentSort = sortOptions.find(o => o.value === sortOption)?.sort || [
    'createdAt;-1',
  ]

  // Keep mobile shell controls aligned with the layout
  useEffect(() => {
    setConfig({
      sidebarVariant: 'chat',
      mobileSidebarHeader: ({ close }) => (
        <div className="sticky top-0 z-50 bg-accent border-b px-3 py-3 flex items-center justify-between shrink-0">
          <button onClick={() => close()} className="flex items-center gap-2">
            <span className="text-lg font-semibold">Collections</span>
          </button>
        </div>
      ),
    })

    return () => resetConfig()
  }, [resetConfig, setConfig])

  useEffect(() => {
    setHasMounted(true)
  }, [])

  // If user logs out, force public scope
  useEffect(() => {
    if (!isSignedIn && scope !== 'public') {
      setScope('public')
    }
  }, [isSignedIn, scope])

  const myCollectionsQuery: FeedCollectionsV2CursorArguments = useMemo(
    () => ({
      limit: 40,
      ...(user?._id ? { user: user._id } : {}),
      sort: currentSort,
    }),
    [user?._id, currentSort],
  )

  const myCollectionsQueryKey = useMemo(
    () => ['feed', 'collections', 'mine', myCollectionsQuery],
    [myCollectionsQuery],
  )

  const { data: myCollectionsData, isLoading: isMyCollectionsLoading } =
    useQuery({
      queryKey: myCollectionsQueryKey,
      enabled: scope === 'mine' && isSignedIn,
      queryFn: () =>
        fetcher<{ docs: CollectionV2[]; nextCursor?: string }>(
          createCursorPaginationRoute('/api/feed/collections', {
            ...myCollectionsQuery,
            cursor: '',
            limit: myCollectionsQuery.limit || 40,
          }),
        ),
      staleTime: 30_000,
    })

  const myCollections = useMemo(
    () => myCollectionsData?.docs || [],
    [myCollectionsData],
  )

  const publicCollectionsQuery: FeedCollectionsV2CursorArguments = useMemo(
    () => ({
      limit: 40,
      sort: currentSort,
    }),
    [currentSort],
  )

  const publicCollectionsQueryKey = useMemo(
    () => ['feed', 'collections', 'public', publicCollectionsQuery],
    [publicCollectionsQuery],
  )

  const { data: publicCollectionsData, isLoading: isPublicCollectionsLoading } =
    useQuery({
      queryKey: publicCollectionsQueryKey,
      enabled: scope === 'public',
      queryFn: () =>
        fetcher<{ docs: CollectionV2[]; nextCursor?: string }>(
          createCursorPaginationRoute('/api/feed/collections', {
            ...publicCollectionsQuery,
            cursor: '',
            limit: publicCollectionsQuery.limit || 40,
          }),
        ),
      staleTime: 30_000,
    })

  const publicCollections = useMemo(
    () => publicCollectionsData?.docs || [],
    [publicCollectionsData],
  )

  // Search query - respects current scope (mine/public)
  const searchQueryArgs: FeedCollectionsV2CursorArguments = useMemo(
    () => ({
      limit: 40,
      search: searchQuery,
      sort: currentSort,
      // Apply scope-specific filters
      ...(scope === 'mine' && user?._id ? { user: user._id } : {}),
    }),
    [searchQuery, scope, user?._id, currentSort],
  )

  const { data: searchResultsData, isLoading: isSearchLoading } = useQuery({
    queryKey: ['feed', 'collections', 'search', scope, searchQueryArgs],
    enabled: !!searchQuery,
    queryFn: () =>
      fetcher<{ docs: CollectionV2[]; nextCursor?: string }>(
        createCursorPaginationRoute('/api/feed/collections', {
          ...searchQueryArgs,
          cursor: '',
          limit: 40,
        }),
      ),
    staleTime: 30_000,
  })

  const searchResults = useMemo(
    () => searchResultsData?.docs || [],
    [searchResultsData],
  )

  const isScopeLoading =
    (scope === 'mine' && isMyCollectionsLoading) ||
    (scope === 'public' && isPublicCollectionsLoading)
  const isPageLoading = !hasMounted || isAuthLoading || isScopeLoading

  const renderScopeFeed = () => {
    if (scope === 'public') {
      if (isPublicCollectionsLoading) {
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        )
      }

      if (!publicCollections.length) {
        return (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            No public collections available.
          </div>
        )
      }

      return (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {publicCollections.map(collection => (
            <CollectionCard
              key={collection._id}
              collection={collection}
              queryKey={publicCollectionsQueryKey}
            />
          ))}
        </div>
      )
    }

    // Mine
    if (isMyCollectionsLoading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      )
    }

    if (!myCollections.length) {
      return (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          You have not created any collections yet.
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {myCollections.map(collection => (
          <CollectionCard
            key={collection._id}
            collection={collection}
            queryKey={myCollectionsQueryKey}
          />
        ))}
      </div>
    )
  }

  const renderSearchResults = () => {
    if (isSearchLoading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      )
    }

    if (searchResults.length === 0) {
      return (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          No collections match your search.
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {searchResults.map(collection => (
          <CollectionCard
            key={collection._id}
            collection={collection}
            queryKey={['feed', 'collections', 'search', scope, searchQueryArgs]}
          />
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Mobile navbar */}
      <div className="md:hidden flex h-12 items-center gap-2 border-b bg-background px-2 flex-shrink-0">
        <button
          onClick={openMobileSidebar}
          className="p-1 hover:bg-muted/10 rounded-lg transition-colors shrink-0"
          aria-label="Open sidebar"
        >
          <MenuIcon className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-xl font-bold">Collections</h1>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        <div className="mx-auto flex flex-col flex-1 min-h-0 w-full">
          <div className="p-4 md:p-6 lg:p-8 flex flex-col gap-6">
            <header className="space-y-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1 hidden md:block">
                  <h1 className="text-3xl font-bold tracking-tight">
                    Collections
                  </h1>
                </div>
              </div>
            </header>

            {isPageLoading ? (
              <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-4 md:p-5">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg bg-muted animate-pulse"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Featured Collections */}
                <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-4 md:p-5 space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">
                      Featured collections
                    </h2>
                  </div>
                  <FeaturedCollections />
                </div>

                {/* Browse Collections */}
                <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-4 md:p-5 space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">
                      Browse collections
                    </h2>
                  </div>

                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <Tabs
                      value={scope}
                      onValueChange={value =>
                        setScope(value as CollectionScope)
                      }
                    >
                      <TabsList className="flex flex-wrap gap-2 bg-muted/50 p-1">
                        <TabsTrigger value="public" className="text-sm">
                          Public
                        </TabsTrigger>
                        <TabsTrigger
                          value="mine"
                          disabled={!isSignedIn}
                          className="text-sm"
                        >
                          Mine
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end w-full lg:w-auto">
                      <Select
                        value={sortOption}
                        onValueChange={(value: CollectionSortOption) =>
                          setSortOption(value)
                        }
                      >
                        <SelectTrigger className="w-full sm:w-[130px]">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          {sortOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FeedSearchForm
                        value={searchInputValue}
                        onInputChange={setSearchInputValue}
                        handleSearch={setSearchQuery}
                        className="w-full sm:w-[260px] lg:w-[320px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {searchQuery
                        ? `Search results for "${searchQuery}"`
                        : scope === 'mine'
                        ? 'Your collections'
                        : 'Public collections'}
                    </p>
                    {searchQuery ? renderSearchResults() : renderScopeFeed()}
                  </div>
                </div>
              </>
            )}

            {/* Footer */}
            <footer className="mt-auto pt-12 pb-6 text-center text-xs text-muted-foreground/60">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                <a
                  href="https://docs.eden.art/legal/tos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-muted-foreground transition-colors"
                >
                  Terms of Service
                </a>
                <span>·</span>
                <a
                  href="https://docs.eden.art/legal/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-muted-foreground transition-colors"
                >
                  Privacy Policy
                </a>
                <span>·</span>
                <a
                  href="https://docs.eden.art/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-muted-foreground transition-colors"
                >
                  Docs
                </a>
                <span>·</span>
                <a
                  href="https://discord.com/invite/4dSYwDT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-muted-foreground transition-colors"
                >
                  Discord
                </a>
                <span>·</span>
                <a
                  href="https://github.com/edenartlab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-muted-foreground transition-colors"
                >
                  GitHub
                </a>
                <span>·</span>
                <a
                  href="https://instagram.com/edenartlab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-muted-foreground transition-colors"
                >
                  Instagram
                </a>
                <span>·</span>
                <a
                  href="https://twitter.com/Eden_Art_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-muted-foreground transition-colors"
                >
                  Twitter
                </a>
              </div>
              <div className="mt-2">
                © 2025 Eden Labs /{' '}
                <a
                  href="mailto:info@eden.art"
                  className="hover:text-muted-foreground transition-colors"
                >
                  info@eden.art
                </a>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </>
  )
}

export default CollectionsPage
