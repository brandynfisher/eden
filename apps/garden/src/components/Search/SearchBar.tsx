import { debounce } from '@mui/material/utils'
import { Input } from 'antd'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

const SearchBar = ({
  baseQuery,
  onSearchSubmit,
}: {
  baseQuery?: {
    userId?: string
  }
  onSearchSubmit: (query: { userId?: string; name?: string }) => void
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const { userId } = baseQuery || {}

  useEffect(() => {
    onSearchSubmit({
      userId,
      name: searchTerm || undefined,
    })
  }, [searchTerm, userId])

  const handleSearchSubmit = useCallback((name: string) => {
    setSearchTerm(name)
  }, [])

  const debouncedHandleFormFieldsChange = useMemo(
    () =>
      debounce(async (ev: React.ChangeEvent<HTMLInputElement>) => {
        handleSearchSubmit(ev.target.value)
      }, 500),
    [handleSearchSubmit],
  )

  return (
    <Input.Search
      className="mb-4"
      placeholder="Search"
      onChange={ev => debouncedHandleFormFieldsChange(ev)}
      onSearch={value => handleSearchSubmit(value)}
      allowClear={true}
      maxLength={256}
    />
  )
}

export default SearchBar
