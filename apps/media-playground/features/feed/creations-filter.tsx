import { BaseFilter } from '@/components/filter/base-filter'
import {
  collectionFilterSection,
  outputTypeFilterSection,
  toolFilterSection,
} from '@/features/shared/filters'
import { FeedCursorRouteQueryParams } from '@edenlabs/eden-sdk'

const creationSections = [
  collectionFilterSection,
  outputTypeFilterSection,
  toolFilterSection,
]

interface CreationsFilterProps {
  onChange: (filter: FeedCursorRouteQueryParams['filter']) => void
  initialFilter?: FeedCursorRouteQueryParams['filter']
  className?: string
}

export function CreationsFilter({
  onChange,
  initialFilter,
  className,
}: CreationsFilterProps) {
  return (
    <BaseFilter
      sections={creationSections}
      onChange={onChange}
      initialFilter={initialFilter}
      className={className}
    />
  )
}
