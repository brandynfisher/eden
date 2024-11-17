import { GenericPageType, PageData, RowItem } from '@/lib/query/cache-updates'
import { create } from 'zustand'

type FeedState = {
  activeIndex: number | null
  items: RowItem[]
  fetchNextPage: (() => Promise<PageData<GenericPageType>>) | null
  setItems: (items: RowItem[]) => void
  setFetchNextPage: (
    fetchNext: () => Promise<PageData<GenericPageType>>,
  ) => void
  setActiveIndex: (index: number | null) => void
  goNext: () => Promise<void>
  goPrevious: () => void
}

type FeedStore = {
  activeFeedId: string | null
  setActiveFeedId: (feedId: string) => void
}

export const useActiveFeedStore = create<FeedStore>(set => ({
  activeFeedId: null,
  setActiveFeedId: feedId => set({ activeFeedId: feedId }),
}))

const createFeedStore = () =>
  create<FeedState>((set, get) => ({
    activeIndex: null,
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
    setActiveIndex: index => set({ activeIndex: index }),
    goNext: async () => {
      const { activeIndex, items, fetchNextPage, setItems } = get()
      if (activeIndex === null || activeIndex >= items.length - 1) {
        if (fetchNextPage) {
          const result = await fetchNextPage()
          const newItems = result.pages.flatMap(page => page.docs ?? [])

          if (newItems && newItems.length > 0) {
            setItems([...items, ...newItems])
          }
        }
      } else {
        set({ activeIndex: activeIndex + 1 })
      }
    },
    goPrevious: () => {
      const { activeIndex } = get()
      if (activeIndex === null || activeIndex <= 0) return
      set({ activeIndex: activeIndex - 1 })
    },
  }))

// Store map to hold scoped stores
const feedStores: Record<string, ReturnType<typeof createFeedStore>> = {}

export const useFeedStore = (feedId: string) => {
  if (!feedStores[feedId]) {
    feedStores[feedId] = createFeedStore()
  }
  return feedStores[feedId]()
}
