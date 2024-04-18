import ArrowRight from '@mui/icons-material/ArrowRight'
import Link from 'next/link'
import React from 'react'

const FeaturedSectionHeader = ({
  title,
  url,
}: {
  title: string
  url?: string
}) => {
  return (
    <div className="flex justify-between flex-wrap items-center mb-2">
      <h2 className="mb-2">{title}</h2>
      {url ? (
        <Link
          title={'Explore all'}
          href={url}
          className="flex items-center text-lg text-gray-500 dark:text-gray-400 hover:dark:text-gray-300"
        >
          Explore all
          <ArrowRight />
        </Link>
      ) : null}
    </div>
  )
}

export default FeaturedSectionHeader
