'use client'

import ConceptCard from '@/components/Concept/ConceptCard/ConceptCard'
import { useConcepts } from '@/hooks/useConcepts'
import { UserContext } from '@/providers/UserProvider'
import { Input, Modal, Switch } from 'antd'
import React, { useContext, useState } from 'react'

const ConceptSelectModal = ({ ...rest }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchAll, setSearchAll] = useState(false)
  const { userId } = useContext(UserContext)
  const { concepts } = useConcepts(userId)

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

  return (
    <Modal
      {...rest}
      className="modal-small max-w-6xl flex flex-col w-full items-center justify-center"
    >
      <h2>Concepts</h2>
      <Input.Search
        placeholder="Search"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        onSearch={handleSearch}
      />

      <Switch
        checked={searchAll}
        onChange={checked => setSearchAll(checked)}
        checkedChildren="Search All"
        unCheckedChildren="Search Recent"
      />

      {concepts
        ? concepts.map((concept, index) => (
            <ConceptCard index={index} key={index} data={concept} />
          ))
        : null}
    </Modal>
  )
}

export default ConceptSelectModal
