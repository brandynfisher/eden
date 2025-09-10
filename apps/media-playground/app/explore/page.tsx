'use client'

import FeedSearchForm from '@/components/filter/feed-search-form'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AgentsFeed from '@/features/feed/agents-feed'
import CreationsFeed, {
  CreationsFeedHandle,
} from '@/features/feed/creations-feed'
import { CreationsFilter } from '@/features/feed/creations-filter'
import ModelsFeed from '@/features/feed/models-feed'
import { SortMenu } from '@/features/feed/sort-menu'
import ToolsFeed from '@/features/feed/tools-feed'
import { ToolsFilter } from '@/features/feed/tools-filter'
import { useAuthState } from '@/hooks/use-auth-state'
import { env } from '@/lib/config'
import { Plus, Zap } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type ContentType = 'creations' | 'models' | 'agents' | 'tools'
type CreatorType = 'public' | 'user'

const ExplorePage = () => {
  const { user } = useAuthState()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const creationsFeedRef = useRef<CreationsFeedHandle>(null)

  // Initialize state from URL parameters
  const initialContentType =
    (searchParams?.get('type') as ContentType) || 'agents'
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

    // If no type parameter, redirect to type=agents (but not during modal state)
    if (!urlContentType && !isModalState) {
      const params = new URLSearchParams(searchParams?.toString() || '')
      params.set('type', 'agents')
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

  // Update URL when tabs change
  const handleContentTypeChange = (value: string) => {
    const newContentType = value as ContentType
    setContentType(newContentType)
    const params = new URLSearchParams(searchParams?.toString())
    params.set('type', newContentType)
    router.push(`/explore${params.toString() ? `?${params.toString()}` : ''}`)
  }

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
          title: 'Explore Agents',
          description:
            'Discover and chat with AI agents created by the community',
          actionButton: (
            <Button asChild size="lg" className="gap-2">
              <Link href="/new/agent">
                <Plus className="h-4 w-4" />
                Create Agent
              </Link>
            </Button>
          ),
        }
      case 'models':
        return {
          title: 'Explore Models',
          description:
            'Browse through diverse models custom-trained by Eden creators',
          actionButton: (
            <Button asChild size="lg" className="gap-2">
              <Link href="/train">
                <Zap className="h-4 w-4" />
                Train Model
              </Link>
            </Button>
          ),
        }
      case 'tools':
        return {
          title: 'Explore Tools',
          description: 'Create multimedia with AI tools',
          actionButton: (
            <Button asChild size="lg" className="gap-2">
              <Link href="/create/image/flux_dev">
                <Zap className="h-4 w-4" />
                Use Tools
              </Link>
            </Button>
          ),
        }
      case 'creations':
      default:
        return {
          title: 'Explore Creations',
          description: 'Discover what people are creating with Eden',
          actionButton: (
            <Button asChild size="lg" className="gap-2">
              <Link href="/create/image/flux_dev">
                <Plus className="h-4 w-4" />
                Create an Image
              </Link>
            </Button>
          ),
        }
    }
  }

  const pageInfo = getPageInfo()

  // Handle arrow key navigation for creation modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle navigation if we're viewing a creation modal
      if (!pathname?.startsWith('/creations/')) return

      const creationId = pathname.split('/creations/')[1]
      if (!creationId || !creationsFeedRef.current) return

      let targetId: string | null = null

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        targetId = creationsFeedRef.current.getAdjacentCreationId(
          creationId,
          'prev',
        )
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        targetId = creationsFeedRef.current.getAdjacentCreationId(
          creationId,
          'next',
        )
      }

      if (targetId) {
        router.push(`/creations/${targetId}`)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [pathname, router])

  const handleCreationNavigation = useCallback(
    (creationId: string) => {
      // This could be used for programmatic navigation if needed
      router.push(`/creations/${creationId}`)
    },
    [router],
  )

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Main Title with Action Button */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{pageInfo.title}</h1>
        {pageInfo.actionButton && (
          <div className="flex-shrink-0">{pageInfo.actionButton}</div>
        )}
      </div>

      {/* Subtitle */}
      <div className="mb-6">
        <p className="text-lg text-muted-foreground">{pageInfo.description}</p>
      </div>

      {/* Content with filters bar */}
      <div className="w-full">
        <div className="flex flex-wrap gap-2 lg:gap-3 w-full mb-6 items-center">
          {/* Content Type Selector - controls content display */}
          <div className="flex rounded-md border bg-background">
            {['agents', 'models', 'creations', 'tools'].map(type => (
              <button
                key={type}
                onClick={() => handleContentTypeChange(type)}
                className={`px-3 py-2 text-sm font-medium transition-colors first:rounded-l-md last:rounded-r-md border-r last:border-r-0 ${
                  contentType === type
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Separator */}
          <div className="h-6 w-px bg-border mx-2" />

          {/* Filter controls */}
          <div className="flex flex-wrap gap-2 lg:gap-3 items-center">
            {/* Ownership Type Tabs - only show for non-tools content types and when user is logged in */}
            {contentType !== 'tools' && user && (
              <Tabs
                value={creatorType}
                onValueChange={handleCreatorTypeChange}
                className="min-w-0 w-full sm:w-auto"
              >
                <TabsList className="flex justify-stretch min-w-0 w-full sm:w-auto sm:min-w-[180px] lg:min-w-[220px]">
                  <TabsTrigger
                    value="public"
                    className="w-full text-sm px-2 lg:px-3"
                  >
                    Public
                  </TabsTrigger>
                  <TabsTrigger
                    value="user"
                    className="w-full text-sm px-2 lg:px-3"
                  >
                    My{' '}
                    {contentType === 'creations'
                      ? 'Creations'
                      : contentType === 'models'
                      ? 'Models'
                      : 'Agents'}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {/* Tools Category Filter - only show for tools */}
            {contentType === 'tools' && (
              <ToolsFilter
                initialCategory={toolsCategory}
                onChange={setToolsCategory}
                className="min-w-0 w-full sm:w-auto"
              />
            )}

            {/* Filters and Sort for each content type */}
            {contentType === 'creations' && (
              <>
                <CreationsFilter
                  initialFilter={creationsFilter}
                  // @ts-expect-error: Filter type mismatch with component props
                  onChange={filter => setCreationsFilter(filter)}
                  className="min-w-0 w-full sm:w-auto"
                />
                <SortMenu
                  variant="creation"
                  initialSort={creationsSort}
                  onChange={setCreationsSort}
                  className="min-w-0 w-full sm:w-auto"
                />
              </>
            )}

            {contentType === 'models' && (
              <SortMenu
                variant="model"
                initialSort={modelsSort}
                onChange={setModelsSort}
                className="min-w-0 w-full sm:w-auto"
              />
            )}

            {contentType === 'agents' && (
              <SortMenu
                variant="agent"
                initialSort={agentsSort}
                onChange={setAgentsSort}
                className="min-w-0 w-full sm:w-auto"
              />
            )}

            <FeedSearchForm
              handleSearch={setSearchQuery}
              className="min-w-0 w-full sm:w-auto sm:min-w-[120px] lg:min-w-[160px]"
            />
          </div>
        </div>

        {/* Content - Render only the active content type */}
        <div className="mt-6 min-h-[400px]">
          {contentType === 'agents' && (
            <AgentsFeed
              query={agentsQuery}
              minCols={1}
              maxCols={6}
              hideCreateButton={true}
              improvedLayout={true}
              hideContextMenu={true}
              breakpoints={[
                { minWidth: 1920, columns: 6 },
                { minWidth: 1536, columns: 5 },
                { minWidth: 1280, columns: 4 },
                { minWidth: 1024, columns: 3 },
                { minWidth: 768, columns: 2 },
                { minWidth: 640, columns: 2 },
                { minWidth: 0, columns: 1 },
              ]}
            />
          )}

          {contentType === 'creations' && (
            <CreationsFeed
              ref={creationsFeedRef}
              query={creationsQuery}
              minCols={2}
              maxCols={8}
              onNavigate={handleCreationNavigation}
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
