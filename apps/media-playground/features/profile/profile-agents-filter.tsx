import { BaseFilter, FilterSection } from '@/components/filter/base-filter'
import { profilePrivacyFilterSections } from '@/features/profile/profile-shared-privacy-filter'
import { FeedCursorRouteQueryParams } from '@edenlabs/eden-sdk'

const profileAgentsFilterSections: FilterSection[] = [
  profilePrivacyFilterSections,
]

interface ProfileAgentsFilterProps {
  onChange: (filter: FeedCursorRouteQueryParams['filter']) => void
  initialFilter?: FeedCursorRouteQueryParams['filter']
}

export function ProfileAgentsFilter({
  onChange,
  initialFilter,
}: ProfileAgentsFilterProps) {
  return (
    <BaseFilter
      sections={profileAgentsFilterSections}
      onChange={onChange}
      initialFilter={initialFilter}
    />
  )
}
