import FeedFilterPopover from '@/components/Search/FeedFilterPopover'
import FeedFilterTrigger from '@/components/Search/FeedFilterTrigger'
import React from 'react'

const FeedFilter = () => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLDivElement | null>(null)

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <div data-testid="feed-filter">
      <FeedFilterTrigger onClick={handleClick} />
      <FeedFilterPopover
        open={Boolean(anchorEl)}
        handleClose={handleClose}
        anchorEl={anchorEl}
      />
    </div>
  )
}

export default FeedFilter
