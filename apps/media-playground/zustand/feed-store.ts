import { RowItem } from '@/lib/query/cache-updates'
import { PaginatedCursorResponse } from '@edenlabs/eden-sdk'
import { create } from 'zustand'

type FeedState = {
  activeIndexMap: Record<string, number | null>
  scrollPositionMap: Record<string, number | null>
  items: RowItem[]
  fetchNextPage: (() => Promise<PaginatedCursorResponse<RowItem>>) | null
  setItems: (items: RowItem[]) => void
  setFetchNextPage: (
    fetchNext: () => Promise<PaginatedCursorResponse<RowItem>>,
  ) => void
  setActiveIndex: (index: number | null) => void
  setScrollPosition: (index: number | null) => void
  getScrollPosition: () => number | null
  goNext: () => Promise<void>
  goPrevious: () => void
  feedId: string
}

type FeedStore = {
  feedHistory: string[]
  addToHistory: (feedId: string) => void
  removeLastFromHistory: () => void
  getActiveFeedId: () => string | null
}

export const useActiveFeedStore = create<FeedStore>((set, get) => ({
  feedHistory: [],
  addToHistory: feedId =>
    set(state => ({
      feedHistory: [...state.feedHistory, feedId],
    })),
  removeLastFromHistory: () =>
    set(state => ({
      feedHistory: state.feedHistory.slice(0, -1),
    })),
  getActiveFeedId: () => {
    const state = get()
    return state.feedHistory.length > 0
      ? state.feedHistory[state.feedHistory.length - 1]
      : null
  },
}))

const createFeedStore = () =>
  create<FeedState>((set, get) => ({
    activeIndexMap: {},
    scrollPositionMap: {},
    items: [],
    fetchNextPage: null,
    setItems: newItems => {
      const { items } = get()
      // Prevent unnecessary updates if the items haven't changed
      if (JSON.stringify(items) !== JSON.stringify(newItems)) {
        set({ items: newItems })
      }
    },
    setFetchNextPage: fetchNext => set({ fetchNextPage: fetchNext }),
    setActiveIndex: index => {
      const { activeIndexMap, feedId } = get()
      set({
        activeIndexMap: {
          ...activeIndexMap,
          [feedId]: index,
        },
      })
    },
    setScrollPosition: index => {
      const { scrollPositionMap, feedId } = get()
      set({
        scrollPositionMap: {
          ...scrollPositionMap,
          [feedId]: index,
        },
      })
    },
    getScrollPosition: () => {
      const { scrollPositionMap, feedId } = get()
      return scrollPositionMap[feedId] ?? null
    },
    goNext: async () => {
      const { activeIndexMap, items, fetchNextPage, setItems, feedId } = get()
      const activeIndex = activeIndexMap[feedId] ?? 0

      const increaseActiveIndex = () => {
        if (activeIndex + 1 >= items.length) {
          return
        }

        set({
          activeIndexMap: {
            ...activeIndexMap,
            [feedId]: activeIndex + 1,
          },
        })
      }

      if (activeIndex >= items.length - 2 && fetchNextPage) {
        const result = await fetchNextPage()

        const newItems = result.docs

        if (newItems && newItems.length > 0) {
          setItems([...items, ...newItems])
        }
        increaseActiveIndex()
      } else {
        increaseActiveIndex()
      }
    },
    goPrevious: () => {
      const { activeIndexMap, feedId } = get()
      const activeIndex = activeIndexMap[feedId] ?? null

      if (activeIndex === null || activeIndex <= 0) {
        return
      }

      set({
        activeIndexMap: {
          ...activeIndexMap,
          [feedId]: activeIndex - 1,
        },
      })
    },
    feedId: '',
  }))

// Store map to hold scoped stores
const feedStores: Record<string, ReturnType<typeof createFeedStore>> = {}

// Track store usage to implement cleanup
const storeUsageCount: Record<string, number> = {}
const storeLastAccessed: Record<string, number> = {}

export const useFeedStore = (feedId: string) => {
  if (!feedStores[feedId]) {
    feedStores[feedId] = createFeedStore()
    feedStores[feedId].setState({ feedId })
  }

  // Track usage
  storeUsageCount[feedId] = (storeUsageCount[feedId] || 0) + 1
  storeLastAccessed[feedId] = Date.now()

  return feedStores[feedId]()
}

// Cleanup function to remove unused stores
export const cleanupFeedStores = () => {
  const now = Date.now()
  const CLEANUP_THRESHOLD = 5 * 60 * 1000 // 5 minutes

  Object.keys(feedStores).forEach(feedId => {
    const lastAccessed = storeLastAccessed[feedId] || 0
    if (now - lastAccessed > CLEANUP_THRESHOLD) {
      delete feedStores[feedId]
      delete storeUsageCount[feedId]
      delete storeLastAccessed[feedId]
    }
  })
}

// Auto cleanup every 2 minutes
if (typeof window !== 'undefined') {
  setInterval(cleanupFeedStores, 2 * 60 * 1000)
}
