'use client'

import FeedSearchForm from '@/components/filter/feed-search-form'
import MyAccountButton from '@/components/navigation/my-account-button'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AgentsFeed from '@/features/feed/agents-feed'
import CreationsFeed from '@/features/feed/creations-feed'
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
import { useEffect, useMemo, useState } from 'react'

type ContentType = 'creations' | 'models' | 'agents' | 'tools'
type CreatorType = 'public' | 'user'

const ExplorePage = () => {
  const { user } = useAuthState()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

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
  const [creationsSort, setCreationsSort] = useState('likeCount;-1')
  const [modelsSort, setModelsSort] = useState('creationCount;-1')
  const [agentsSort, setAgentsSort] = useState('stats.userMessageCount;-1')
  const [toolsCategory, setToolsCategory] = useState('featured')
  const [showLoginModal, setShowLoginModal] = useState(false)

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

  // Query builders for each content type
  const creationsQuery = useMemo(
    () => ({
      // Only apply collection filter for public creations, not for user's own creations
      ...(creatorType === 'public' ? creationsFilter : {}),
      ...(creatorType === 'user' && user?._id ? { user: user._id } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
      sort: creationsSort,
    }),
    [creationsFilter, creatorType, user?._id, searchQuery, creationsSort],
  )

  const modelsQuery = useMemo(
    () => ({
      ...modelsFilter,
      ...(creatorType === 'user' && user?._id ? { user: user._id } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
      sort: modelsSort,
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
    // If user is not logged in and tries to access "user" tab, show modal
    if (newCreatorType === 'user' && !user?._id) {
      setShowLoginModal(true)
      return
    }
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
          actionButton: null,
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

      {/* Content Type Tabs */}
      <Tabs
        value={contentType}
        onValueChange={handleContentTypeChange}
        className="w-full"
      >
        <div className="flex flex-wrap gap-2 lg:gap-3 w-full mb-6 items-center">
          {/* Filter controls */}
          <div className="flex flex-wrap gap-2 lg:gap-3 items-center">
            {/* Ownership Type Tabs - only show for non-tools content types */}
            {contentType !== 'tools' && (
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
                  // @ts-ignore
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

        {/* Content */}
        <TabsContent value="agents" className="!ring-0 !ring-offset-0 mt-6">
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
        </TabsContent>

        <TabsContent value="creations" className="!ring-0 !ring-offset-0 mt-6">
          <CreationsFeed query={creationsQuery} minCols={2} maxCols={8} />
        </TabsContent>

        <TabsContent value="models" className="!ring-0 !ring-offset-0 mt-6">
          <ModelsFeed
            query={modelsQuery}
            minCols={1}
            maxCols={5}
            variant="creation-page"
          />
        </TabsContent>

        <TabsContent value="tools" className="!ring-0 !ring-offset-0 mt-6">
          <ToolsFeed category={toolsCategory} searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            You need to log in to view your agents, models, or creations.
          </div>
          <DialogFooter>
            <MyAccountButton />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ExplorePage
