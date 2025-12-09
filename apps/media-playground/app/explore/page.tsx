'use client'

import FeedSearchForm from '@/components/filter/feed-search-form'
import { useAppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AgentsFeed from '@/features/feed/agents-feed'
import CreationsFeed from '@/features/feed/creations-feed'
import { CreationsFilter } from '@/features/feed/creations-filter'
import ModelsFeed from '@/features/feed/models-feed'
import { SortMenu } from '@/features/feed/sort-menu'
import ToolsFeed from '@/features/feed/tools-feed'
import { ToolsFilter } from '@/features/feed/tools-filter'
import { useAuthState } from '@/hooks/use-auth-state'
import { env } from '@/lib/config'
import { MenuIcon, Plus, SlidersHorizontal, Wrench, Zap } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ReactNode, useEffect, useMemo, useState } from 'react'

type ContentType = 'creations' | 'models' | 'agents' | 'tools'
type CreatorType = 'public' | 'user'

type FilterSectionProps = {
  label: string
  children: ReactNode
  className?: string
}

const FilterSection = ({
  label,
  children,
  className = '',
}: FilterSectionProps) => (
  <div className={`space-y-2 ${className}`}>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
    {children}
  </div>
)

const ExplorePage = () => {
  const { user } = useAuthState()
  const { openMobileSidebar } = useAppShell()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Initialize state from URL parameters - default to creations
  const initialContentType =
    (searchParams?.get('type') as ContentType) || 'creations'
  const initialCreatorType =
    (searchParams?.get('creator') as CreatorType) || 'public'

  const [contentType, setContentType] =
    useState<ContentType>(initialContentType)
  const [creatorType, setCreatorType] =
    useState<CreatorType>(initialCreatorType)
  const [searchQuery, setSearchQuery] = useState('')
  const [creationsFilter, setCreationsFilter] = useState({
    collection: env.NEXT_PUBLIC_EDEN_FEATURED_COLLECTION_ID,
  })
  const [modelsFilter] = useState({})
  const [creationsSort, setCreationsSort] = useState('createdAt;-1')
  const [modelsSort, setModelsSort] = useState('creationCount;-1')
  const [agentsSort, setAgentsSort] = useState('stats.userMessageCount;-1')
  const [toolsCategory, setToolsCategory] = useState('featured')
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)

  // Sync state with URL parameters when they change
  useEffect(() => {
    const urlContentType = searchParams?.get('type') as ContentType
    const urlCreatorType =
      (searchParams?.get('creator') as CreatorType) || 'public'

    // Check if current pathname suggests we're in a modal
    const isModalState =
      pathname?.startsWith('/creations/') ||
      pathname?.startsWith('/models/') ||
      pathname?.startsWith('/agents/')

    // If no type parameter, redirect to type=creations (but not during modal state)
    if (!urlContentType && !isModalState) {
      const params = new URLSearchParams(searchParams?.toString() || '')
      params.set('type', 'creations')
      router.replace(`/explore?${params.toString()}`)
      return
    }

    if (urlContentType !== contentType) {
      setContentType(urlContentType)
    }
    if (urlCreatorType !== creatorType) {
      setCreatorType(urlCreatorType)
    }
  }, [searchParams, contentType, creatorType, router, pathname])

  // Reset to public view when user logs out
  useEffect(() => {
    if (!user && creatorType === 'user') {
      setCreatorType('public')
      const params = new URLSearchParams(searchParams?.toString())
      params.delete('creator')
      router.replace(
        `/explore${params.toString() ? `?${params.toString()}` : ''}`,
      )
    }
  }, [user, creatorType, searchParams, router])

  // Query builders for each content type
  const creationsQuery = useMemo(
    () => ({
      // Only apply collection filter for public creations, not for user's own creations
      ...(creatorType === 'public' ? creationsFilter : {}),
      ...(creatorType === 'user' && user?._id ? { user: user._id } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
      sort: [creationsSort],
    }),
    [creationsFilter, creatorType, user?._id, searchQuery, creationsSort],
  )

  const modelsQuery = useMemo(
    () => ({
      ...modelsFilter,
      ...(creatorType === 'user' && user?._id ? { user: user._id } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
      sort: [modelsSort],
    }),
    [modelsFilter, creatorType, user?._id, searchQuery, modelsSort],
  )

  const agentsQuery = useMemo(
    () => ({
      limit: 35,
      sort: [agentsSort],
      ...(creatorType === 'user' && user?._id ? { user: user._id } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
    }),
    [agentsSort, creatorType, user?._id, searchQuery],
  )

  const actionButtonClasses =
    'gap-2 w-full justify-center md:w-auto md:justify-start h-12 text-lg'

  // Update URL when creator type changes
  const handleCreatorTypeChange = (value: string) => {
    const newCreatorType = value as CreatorType
    setCreatorType(newCreatorType)
    const params = new URLSearchParams(searchParams?.toString())
    if (newCreatorType !== 'public') {
      params.set('creator', newCreatorType)
    } else {
      params.delete('creator')
    }
    router.push(`/explore${params.toString() ? `?${params.toString()}` : ''}`)
  }

  // Get page title and description based on content type
  const getPageInfo = () => {
    switch (contentType) {
      case 'agents':
        return {
          title: 'Explore',
          description:
            'Discover and chat with AI agents created by the community',
          actionButton: (
            <Button asChild size="lg" className={actionButtonClasses}>
              <Link href="/new/agent">
                <Plus className="h-4 w-4" />
                Create an Agent
              </Link>
            </Button>
          ),
        }
      case 'models':
        return {
          title: 'Explore',
          description:
            'Browse through diverse models custom-trained by Eden creators',
          actionButton: (
            <Button asChild size="lg" className={actionButtonClasses}>
              <Link href="/studio/lora/flux_trainer">
                <Zap className="h-4 w-4" />
                Train a Model
              </Link>
            </Button>
          ),
        }
      case 'tools':
        return {
          title: 'Explore',
          description: 'Create multimedia with AI tools',
          actionButton: (
            <Button asChild size="lg" className={actionButtonClasses}>
              <Link href="/studio/image/flux_dev">
                <Wrench className="h-4 w-4" />
                Visit the Studio
              </Link>
            </Button>
          ),
        }
      case 'creations':
      default:
        return {
          title: 'Explore',
          description: 'Discover what people are creating with Eden',
          actionButton: (
            <Button asChild size="lg" className={actionButtonClasses}>
              <Link href="/studio/image/seedream4">
                <Plus className="h-4 w-4" />
                Create an Image
              </Link>
            </Button>
          ),
        }
    }
  }

  const pageInfo = getPageInfo()

  // Handle content type change
  const handleContentTypeChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set('type', value)
    router.push(`/explore?${params.toString()}`)
  }

  const renderFilterSections = (
    layout: 'desktop' | 'mobile',
    options?: { includeSearch?: boolean },
  ) => {
    const sections: ReactNode[] = []
    const showCreatorTabs = contentType !== 'tools' && !!user
    const showCreationsFilter = contentType === 'creations'
    const showToolsFilter = contentType === 'tools'
    const showSortMenu =
      contentType === 'creations' ||
      contentType === 'models' ||
      contentType === 'agents'

    const controlWidth =
      layout === 'desktop'
        ? 'w-full sm:max-w-[220px] lg:max-w-[260px]'
        : 'w-full'

    if (options?.includeSearch) {
      sections.push(
        <FilterSection
          key="search"
          label="Search"
          className="lg:col-span-2 xl:col-span-1"
        >
          <FeedSearchForm handleSearch={setSearchQuery} className="w-1/2" />
        </FilterSection>,
      )
    }

    if (showCreatorTabs) {
      sections.push(
        <FilterSection key="creator-scope" label="Scope">
          <Tabs
            value={creatorType}
            onValueChange={handleCreatorTypeChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 gap-1 rounded-xl bg-muted/40 p-1">
              <TabsTrigger value="public" className="text-sm">
                Public
              </TabsTrigger>
              <TabsTrigger value="user" className="text-sm">
                My{' '}
                {contentType === 'creations'
                  ? 'Creations'
                  : contentType === 'models'
                  ? 'Models'
                  : 'Agents'}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </FilterSection>,
      )
    }

    if (showToolsFilter) {
      sections.push(
        <FilterSection key="tools-category" label="Category">
          <ToolsFilter
            initialCategory={toolsCategory}
            onChange={setToolsCategory}
            className="w-full"
          />
        </FilterSection>,
      )
    }

    if (showCreationsFilter) {
      sections.push(
        <FilterSection key="creations-filter" label="Collection">
          <CreationsFilter
            initialFilter={creationsFilter}
            // @ts-expect-error: Filter type mismatch with component props
            onChange={filter => setCreationsFilter(filter)}
            className="w-full"
          />
        </FilterSection>,
      )
    }

    if (showSortMenu) {
      sections.push(
        <FilterSection key="sort-menu" label="Sort">
          {contentType === 'creations' && (
            <SortMenu
              variant="creation"
              initialSort={creationsSort}
              onChange={setCreationsSort}
              className={controlWidth}
            />
          )}
          {contentType === 'models' && (
            <SortMenu
              variant="model"
              initialSort={modelsSort}
              onChange={setModelsSort}
              className={controlWidth}
            />
          )}
          {contentType === 'agents' && (
            <SortMenu
              variant="agent"
              initialSort={agentsSort}
              onChange={setAgentsSort}
              className={controlWidth}
            />
          )}
        </FilterSection>,
      )
    }

    return sections
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Mobile navbar */}
      <div className="md:hidden flex h-12 items-center gap-2 border-b bg-background px-3 flex-shrink-0">
        <button
          onClick={openMobileSidebar}
          className="p-1 hover:bg-muted/10 rounded-lg transition-colors shrink-0"
          aria-label="Open sidebar"
        >
          <MenuIcon className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-xl font-bold">{pageInfo.title}</h1>
      </div>

      <div className="p-4 md:p-6 lg:p-8">
        {/* Main Title with Action Button (hide title/subtitle on mobile for consistency) */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1 hidden md:block">
            <h1 className="text-3xl font-bold tracking-tight leading-tight md:text-4xl">
              {pageInfo.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {pageInfo.description}
            </p>
          </div>

          {/* Action button */}
          {pageInfo.actionButton && (
            <div className="w-full md:w-auto md:flex-shrink-0">
              {pageInfo.actionButton}
            </div>
          )}
        </div>

        <div className="w-full space-y-4">
          {/* Content Type Tabs */}
          <Tabs value={contentType} onValueChange={handleContentTypeChange}>
            <TabsList className="flex w-full flex-wrap gap-2 bg-muted p-1">
              <TabsTrigger value="agents" className="flex-1 text-sm">
                Agents
              </TabsTrigger>
              <TabsTrigger value="models" className="flex-1 text-sm">
                Models
              </TabsTrigger>
              <TabsTrigger value="creations" className="flex-1 text-sm">
                Creations
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex-1 text-sm">
                Tools
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search (mobile only, desktop lives with filters) */}
          <div className="md:hidden">
            <FeedSearchForm handleSearch={setSearchQuery} className="w-full" />
          </div>

          {/* Mobile filter access */}
          <div className="md:hidden">
            <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between gap-2"
                >
                  <span className="font-medium">Filters</span>
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="h-[80vh] overflow-y-auto px-4 sm:px-6"
              >
                <SheetHeader>
                  <SheetTitle>Quick filters</SheetTitle>
                  <SheetDescription>
                    Switch scope or dial in collections without leaving the
                    feed.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  {renderFilterSections('mobile')}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop & tablet filter layout */}
          <div className="hidden md:block">
            <div className="rounded-2xl border border-border/40 bg-muted/5 p-4">
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                {renderFilterSections('desktop', { includeSearch: true })}
              </div>
            </div>
          </div>
        </div>

        {/* Content - Render only the active content type */}
        <div className="mt-6 min-h-[400px]">
          {contentType === 'agents' && (
            <AgentsFeed
              query={agentsQuery}
              minCols={1}
              maxCols={4}
              hideCreateButton={true}
              improvedLayout={true}
              hideContextMenu={true}
              breakpoints={[
                { minWidth: 1280, columns: 4 },
                { minWidth: 1024, columns: 3 },
                { minWidth: 768, columns: 2 },
                { minWidth: 0, columns: 1 },
              ]}
            />
          )}

          {contentType === 'creations' && (
            <CreationsFeed
              query={creationsQuery}
              minCols={2}
              maxCols={8}
              debugLabel="explore/creations"
            />
          )}

          {contentType === 'models' && (
            <ModelsFeed
              query={modelsQuery}
              minCols={1}
              maxCols={5}
              variant="creation-page"
            />
          )}

          {contentType === 'tools' && (
            <ToolsFeed category={toolsCategory} searchQuery={searchQuery} />
          )}
        </div>
      </div>
    </div>
  )
}

export default ExplorePage
