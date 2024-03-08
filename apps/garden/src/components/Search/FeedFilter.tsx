import FeedFilterPopover from '@/components/Search/FeedFilterPopover'
import FeedFilterTrigger from '@/components/Search/FeedFilterTrigger'
import React, { MutableRefObject } from 'react'

const FeedFilter = ({
  containerRef,
}: {
  containerRef?: MutableRefObject<HTMLDivElement>
}) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLDivElement | null>(null)

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    console.log({ feedFilterTarget: event.currentTarget })
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <div data-testid="feed-filter">
      <FeedFilterTrigger onClick={handleClick} />
      <FeedFilterPopover
        containerRef={containerRef}
        open={Boolean(anchorEl)}
        handleClose={handleClose}
        anchorEl={anchorEl}
      />
    </div>
  )
}

export default FeedFilter
