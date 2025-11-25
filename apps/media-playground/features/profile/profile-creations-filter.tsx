import { BaseFilter } from '@/components/filter/base-filter'
import {
  profileLikedFilterSection,
  profilePrivacyFilterSections,
} from '@/features/profile/profile-shared-privacy-filter'
import {
  outputTypeFilterSection,
  toolFilterSection,
} from '@/features/shared/filters'
import { FeedCursorRouteQueryParams } from '@edenlabs/eden-sdk'

const profileCreationSections = [
  profileLikedFilterSection,
  profilePrivacyFilterSections,
  outputTypeFilterSection,
  toolFilterSection,
]

interface ProfileCreationsFilterProps {
  onChange: (filter: FeedCursorRouteQueryParams['filter']) => void
  initialFilter?: FeedCursorRouteQueryParams['filter']
  excludeFromCount?: string[]
}

export function ProfileCreationsFilter({
  onChange,
  initialFilter,
  excludeFromCount,
}: ProfileCreationsFilterProps) {
  return (
    <BaseFilter
      sections={profileCreationSections}
      onChange={onChange}
      initialFilter={initialFilter}
      excludeFromCount={excludeFromCount}
    />
  )
}
