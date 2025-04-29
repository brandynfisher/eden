import { BaseFilter } from '@/components/filter/base-filter'
import { profilePrivacyFilterSections } from '@/features/profile/profile-shared-privacy-filter'
import {
  outputTypeFilterSection,
  toolFilterSection,
} from '@/features/shared/filters'
import { FeedCursorRouteQueryParams } from '@edenlabs/eden-sdk'

const profileCreationSections = [
  profilePrivacyFilterSections,
  outputTypeFilterSection,
  toolFilterSection,
]

interface ProfileCreationsFilterProps {
  onChange: (filter: FeedCursorRouteQueryParams['filter']) => void
  initialFilter?: FeedCursorRouteQueryParams['filter']
}

export function ProfileCreationsFilter({
  onChange,
  initialFilter,
}: ProfileCreationsFilterProps) {
  return (
    <BaseFilter
      sections={profileCreationSections}
      onChange={onChange}
      initialFilter={initialFilter}
    />
  )
}
