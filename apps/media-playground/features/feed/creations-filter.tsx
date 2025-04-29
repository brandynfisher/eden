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
}

export function CreationsFilter({
  onChange,
  initialFilter,
}: CreationsFilterProps) {
  return (
    <BaseFilter
      sections={creationSections}
      onChange={onChange}
      initialFilter={initialFilter}
    />
  )
}
