import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import debounce from 'lodash/debounce'
import { XIcon } from 'lucide-react'
import { SearchIcon } from 'lucide-react'
import React, { useMemo, useState } from 'react'

export default function FeedSearchForm({
  handleSearch,
}: {
  handleSearch: (value: string) => void
}) {
  const [searchInput, setSearchInput] = useState('')

  const debouncedSearch = useMemo(
    () => debounce((value: string) => handleSearch(value), 500),
    [handleSearch], // Recreate debounced function when tab changes
  )

  const handleSearchInput = (value: string) => {
    setSearchInput(value)
    debouncedSearch(value)
  }

  const handleSearchReset = () => {
    setSearchInput('')
    handleSearch('')
  }

  return (
    <div className="flex items-center sm:mb-0 w-full sm:w-auto min-w-[160px] shrink-0">
      <div className="shrink-0 border rounded-l-md size-10 items-center justify-center flex bg-muted/40 md:ml-auto">
        <SearchIcon className="w-4 h-4" />
      </div>
      <Input
        className="rounded-none border-l-transparent border-r-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-purple-600/40"
        placeholder="Search"
        value={searchInput}
        onChange={e => handleSearchInput(e.target.value)}
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
