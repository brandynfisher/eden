'use client'

import ConceptCard from '@/components/Concept/ConceptCard/ConceptCard'
import MasonryInfiniteScrollable from '@/components/MasonryInfiniteScrollable'
import ModalTitle from '@/components/Modals/ModalTitle'
import { PaginatedFeedQuery } from '@/hooks/useFeedPaginated'
import { UserContext } from '@/providers/UserProvider'
import { Concept } from '@edenlabs/eden-sdk'
import LinkOutlined from '@mui/icons-material/LinkOutlined'
import { debounce } from '@mui/material/utils'
import { Input, Modal, Switch } from 'antd'
import React, { useCallback, useContext, useMemo, useState } from 'react'

const ConceptSelectModal = ({
  onChange,
  ...rest
}: {
  onChange: (concept: Concept) => void
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchPublic, setSearchPublic] = useState(true)
  const [query, setQuery] = useState<PaginatedFeedQuery>({})
  const { userId } = useContext(UserContext)

  const handleSearchSubmit = useCallback(
    (name: string, showPublic: boolean) => {
      // console.log('handleSearch', name, showPublic, userId)

      setQuery(prev => ({
        ...prev,
        name: name || undefined,
        userId: (!showPublic && userId) || undefined,
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

  return (
    <Modal
      {...rest}
      className="modal-small modal-grow max-w-6xl pb-0 flex flex-col w-full items-center justify-center"
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
      <div className="p-4 pb-0 bg-gray-200 dark:bg-gray-950 !rounded-xl">
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
          type="concepts"
          ItemComponent={ConceptCard}
          query={query}
          onCardClick={concept => onChange(concept as Concept)}
          hover={true}
        />
      </div>
    </Modal>
  )
}

export default ConceptSelectModal
