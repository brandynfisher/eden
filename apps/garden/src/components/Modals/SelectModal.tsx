'use client'

import OrderByButtons, {
  OrderByDefaultParam,
  OrderByLatest,
  OrderByParam,
  OrderByUsage,
} from '@/components/Layout/buttons/OrderByButtons'
import MasonryInfiniteScrollable from '@/components/Masonry/MasonryInfiniteScrollable'
import ModalTitle from '@/components/Modals/ModalTitle'
import SearchBar from '@/components/Search/SearchBar'
import { PaginatedFeedQuery } from '@/hooks/useFeedPaginated'
import { UserContext } from '@/providers/UserProvider'
import { Character, Concept } from '@edenlabs/eden-sdk'
import { useElementSize } from '@mantine/hooks'
import LinkOutlined from '@mui/icons-material/LinkOutlined'
import { Modal, Switch } from 'antd'
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

const SelectModal = ({
  onChange,
  itemType,
  ...rest
}: {
  itemType: 'concept' | 'character'
  onChange: (concept: Concept | Character) => void
}) => {
  const { userId } = useContext(UserContext)
  // const [baseQuery, setBaseQuery] = useState<PaginatedFeedQuery>()
  const [query, setQuery] = useState<PaginatedFeedQuery>()
  const [searchPublic, setSearchPublic] = useState(false)

  const handleSearchPublicToggle = (checked: boolean) => {
    setSearchPublic(checked)
  }

  const { ref: containerRef, height: containerHeight } = useElementSize()

  const modalContainerRef = useRef<HTMLDivElement | null>(null)

  const docsLinkUrl = `https://docs.eden.art/docs/guides/${itemType}s`
  const label = itemType === 'concept' ? 'Concept' : 'Character'

  useEffect(() => {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          const modalWrap = (mutation.target as HTMLElement).querySelector(
            '.ant-modal-wrap',
          )
          if (modalWrap) {
            containerRef.current = modalWrap as HTMLDivElement
            // console.log(containerRef.current); // You can now access .ant-modal-wrap here
          }
        }
      })
    })

    if (modalContainerRef.current) {
      observer.observe(modalContainerRef.current, { childList: true })
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth
    document.body.style.paddingRight = `${scrollbarWidth}px`
    document.body.style.overflow = 'hidden'
    document.body.classList.add('relative')
    document.body.classList.add('overflow-hidden')

    return () => {
      document.body.style.paddingRight = ''
      document.body.style.overflow = ''
      document.body.classList.remove('relative')
      document.body.classList.remove('overflow-hidden')
    }
  }, [])

  const [orderBy, setOrderBy] = useState<OrderByParam>(OrderByDefaultParam)
  const [renderCount, setRenderCount] = useState(0)
  const [key, setKey] = useState(`${OrderByDefaultParam.field}_${0}`)
  const handleOrderChange = useCallback(
    (newOrderBy: OrderByParam) => {
      if (newOrderBy.field !== orderBy?.field) {
        // console.log(newOrderBy)
        setOrderBy(newOrderBy)
        setKey(`${newOrderBy.field}_${renderCount}`)
      }
    },
    [renderCount],
  )

  useEffect(() => {
    setRenderCount(prevState => prevState + 1)
  }, [orderBy, itemType, searchPublic])

  return (
    <div ref={modalContainerRef}>
      <Modal
        {...rest}
        className="modal-small modal-grow max-w-6xl pb-0 flex flex-col w-full items-center justify-center"
        getContainer={() =>
          modalContainerRef?.current || document.createElement('div')
        }
      >
        <ModalTitle
          title={`Select ${label}`}
          link={
            <a
              href={docsLinkUrl}
              target="_blank"
              className="flex gap-1 items-center"
            >
              Learn about {label}s
              <LinkOutlined />
            </a>
          }
        />
        <div className="p-4 pb-0 !rounded-xl">
          <div className="mb-4">
            <SearchBar
              onSearchSubmit={query => {
                setQuery(query)
              }}
              baseQuery={!searchPublic && userId ? { userId } : undefined}
            />
            <div className="flex flex-wrap gap-2">
              <Switch
                checked={searchPublic}
                onChange={checked => handleSearchPublicToggle(checked)}
                checkedChildren={`All ${label}`}
                unCheckedChildren={`My ${label}`}
              />
            </div>
          </div>

          <OrderByButtons
            params={[OrderByLatest, OrderByUsage]}
            initialParam={OrderByLatest}
            onOrderChange={item => handleOrderChange(item)}
          />

          <MasonryInfiniteScrollable
            masonryKeySuffix={'selectmodal'}
            key={`public_${itemType}_${searchPublic}_${key}`}
            itemType={itemType}
            query={query}
            onCardClick={item => onChange(item as Concept | Character)}
            hover={true}
            orderBy={orderBy}
            modalContainerRef={containerRef}
            modalContainerHeight={containerHeight}
          />
        </div>
      </Modal>
    </div>
  )
}

export default SelectModal
