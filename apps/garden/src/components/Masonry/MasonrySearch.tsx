// MasonrySearch.tsx
import { Input } from 'antd'
import React, { useState } from 'react'

interface MasonrySearchProps {
  onSearch: (value: string) => void
}

const MasonrySearch: React.FC<MasonrySearchProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    onSearch(value)
  }

  return (
    <Input.Search
      placeholder="Search by name"
      value={searchTerm}
      onChange={e => setSearchTerm(e.target.value)}
      onSearch={handleSearch}
      style={{ marginBottom: '20px' }}
    />
  )
}

export default MasonrySearch
