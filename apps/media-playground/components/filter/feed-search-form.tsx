import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import debounce from 'lodash/debounce'
import { XIcon } from 'lucide-react'
import { SearchIcon } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export default function FeedSearchForm({
  handleSearch,
  className,
  value,
  onInputChange,
}: {
  handleSearch: (value: string) => void
  className?: string
  value?: string
  onInputChange?: (value: string) => void
}) {
  // Use controlled value if provided, otherwise use internal state
  const [internalSearchInput, setInternalSearchInput] = useState('')
  const isControlled = value !== undefined
  const searchInput = isControlled ? value : internalSearchInput

  // Use ref to store the latest handleSearch to avoid recreating debounced function
  const handleSearchRef = useRef(handleSearch)
  useEffect(() => {
    handleSearchRef.current = handleSearch
  }, [handleSearch])

  const debouncedSearch = useMemo(
    () => debounce((val: string) => handleSearchRef.current(val), 500),
    [],
  )

  const handleSearchInputChange = useCallback(
    (val: string) => {
      if (isControlled) {
        // In controlled mode, notify parent of input change immediately
        onInputChange?.(val)
      } else {
        setInternalSearchInput(val)
      }
      debouncedSearch(val)
    },
    [isControlled, debouncedSearch, onInputChange],
  )

  const handleSearchReset = useCallback(() => {
    if (isControlled) {
      onInputChange?.('')
    } else {
      setInternalSearchInput('')
    }
    debouncedSearch.cancel()
    handleSearchRef.current('')
  }, [isControlled, debouncedSearch, onInputChange])

  return (
    <div
      className={cn(
        'flex items-center sm:mb-0 w-full sm:w-auto min-w-[160px] shrink-0',
        className,
      )}
    >
      <div className="shrink-0 border rounded-l-md size-10 items-center justify-center flex bg-muted/40 md:ml-auto">
        <SearchIcon className="w-4 h-4" />
      </div>
      <Input
        className="rounded-none border-l-transparent border-r-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-purple-600/40"
        placeholder="Search"
        value={searchInput}
        onChange={e => handleSearchInputChange(e.target.value)}
      />
      <Button
        variant="outline"
        size="icon"
        className={cn(['rounded-l-none bg-muted/40'])}
        onClick={handleSearchReset}
        disabled={!searchInput}
      >
        <XIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}
