'use client'

import ConceptCard from '@/components/Concept/ConceptCard/ConceptCard'
import MasonryInfiniteScrollable from '@/components/Masonry/MasonryInfiniteScrollable'
import ModalTitle from '@/components/Modals/ModalTitle'
import { PaginatedFeedQuery } from '@/hooks/useFeedPaginated'
import { UserContext } from '@/providers/UserProvider'
import { Concept } from '@edenlabs/eden-sdk'
import { useElementSize } from '@mantine/hooks'
import LinkOutlined from '@mui/icons-material/LinkOutlined'
import { debounce } from '@mui/material/utils'
import { Input, Modal, Switch } from 'antd'
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

const ConceptSelectModal = ({
  onChange,
  ...rest
}: {
  onChange: (concept: Concept) => void
}) => {
  const { userId } = useContext(UserContext)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchPublic, setSearchPublic] = useState(false)
  const [query, setQuery] = useState<PaginatedFeedQuery>({
    userId: userId || undefined,
  })

  const handleSearchSubmit = useCallback(
    (name: string, showPublic: boolean) => {
      // console.log('handleSearch', name, showPublic, userId)

      setQuery(prev => ({
        ...prev,
        name: name || undefined,
        userId: !showPublic ? userId || undefined : undefined,
      }))
    },
    [userId, setQuery],
  )

  const handleSearchPublicToggle = (checked: boolean) => {
    setSearchPublic(checked)
    handleSearchSubmit(searchTerm, checked)
  }

  const debouncedHandleFormFieldsChange = useMemo(
    () =>
      debounce(async (ev: React.ChangeEvent<HTMLInputElement>) => {
        // console.log(ev.target.value)
        setSearchTerm(ev.target.value)
        handleSearchSubmit(ev.target.value, searchPublic)
      }, 500),
    [handleSearchSubmit, setSearchTerm, searchPublic],
  )

  const { ref: containerRef, height: containerHeight } = useElementSize()

  const modalContainerRef = useRef<HTMLDivElement | null>(null)

  // other code...

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
          title="Select Concept"
          link={
            <a
              href="https://docs.eden.art/docs/guides/concepts"
              target="_blank"
              className="flex gap-1 items-center"
            >
              Learn about Concepts
              <LinkOutlined />
            </a>
          }
        />
        <div className="p-4 pb-0 !rounded-xl">
          <div className="mb-4">
            <Input.Search
              className="mb-4"
              placeholder="Search"
              onChange={ev => debouncedHandleFormFieldsChange(ev)}
              onSearch={value => handleSearchSubmit(value, searchPublic)}
              allowClear={true}
              maxLength={256}
            />
            <div className="flex flex-wrap gap-2">
              <Switch
                checked={searchPublic}
                onChange={checked => handleSearchPublicToggle(checked)}
                checkedChildren="All Concepts"
                unCheckedChildren="My Concepts"
              />
            </div>
          </div>
          <MasonryInfiniteScrollable
            key={`public_${searchPublic}`}
            itemType="concept"
            ItemComponent={ConceptCard}
            query={query}
            onCardClick={concept => onChange(concept as Concept)}
            hover={true}
            modalContainerRef={containerRef}
            modalContainerHeight={containerHeight}
          />
        </div>
      </Modal>
    </div>
  )
}

export default ConceptSelectModal
