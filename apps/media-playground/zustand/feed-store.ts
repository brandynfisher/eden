import { GenericPageType, PageData, RowItem } from '@/lib/query/cache-updates'
import { create } from 'zustand'

type FeedState = {
  activeIndexMap: Record<string, number | null>
  items: RowItem[]
  fetchNextPage: (() => Promise<PageData<GenericPageType>>) | null
  setItems: (items: RowItem[]) => void
  setFetchNextPage: (
    fetchNext: () => Promise<PageData<GenericPageType>>,
  ) => void
  setActiveIndex: (index: number | null) => void
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
      const { activeIndexMap } = get()
      set({
        activeIndexMap: {
          ...activeIndexMap,
          [get().feedId]: index,
        },
      })
    },
    goNext: async () => {
      const { activeIndexMap, items, fetchNextPage, setItems, feedId } = get()
      const activeIndex = activeIndexMap[feedId] ?? null

      if (activeIndex === null || activeIndex >= items.length - 1) {
        if (fetchNextPage) {
          const result = await fetchNextPage()
          const newItems = result.pages.flatMap(page => page.docs ?? [])

          if (newItems && newItems.length > 0) {
            setItems([...items, ...newItems])
          }
        }
      } else {
        set({
          activeIndexMap: {
            ...activeIndexMap,
            [feedId]: activeIndex + 1,
          },
        })
      }
    },
    goPrevious: () => {
      const { activeIndexMap, feedId } = get()
      const activeIndex = activeIndexMap[feedId] ?? null

      if (activeIndex === null || activeIndex <= 0) return
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

export const useFeedStore = (feedId: string) => {
  if (!feedStores[feedId]) {
    feedStores[feedId] = createFeedStore()
    feedStores[feedId].setState({ feedId })
  }
  return feedStores[feedId]()
}
