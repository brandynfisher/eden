import ArrowRight from '@mui/icons-material/ArrowRight'
import Link from 'next/link'
import React, { ReactNode } from 'react'
import ScrollContainer from 'react-indiana-drag-scroll'

const HorizontalGallery = ({
  title,
  url,
  children,
}: {
  title: string
  url: string
  children: ReactNode
}) => {
  return (
    <div className="mb-4">
      <div className="flex justify-between flex-wrap items-center">
        <h2 className="mb-2">{title}</h2>
        <Link title={'Show all'} href={url} className="flex items-center">
          Show all <ArrowRight />
        </Link>
      </div>
      <ScrollContainer
        vertical={false}
        horizontal={true}
        hideScrollbars={false}
        className="grid gap-4 grid-rows-1 grid-flow-col pb-4 after:content-[''] snap-x snap-mandatory"
        style={{ gridAutoColumns: 'minmax(300px, 450px)' }}
      >
        {children}
      </ScrollContainer>
    </div>
  )
}

export default HorizontalGallery
