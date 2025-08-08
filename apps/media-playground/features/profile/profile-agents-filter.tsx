import { BaseFilter, FilterSection } from '@/components/filter/base-filter'
import { profileAgentsOwnershipFilter } from '@/features/profile/profile-agents-ownership-filter'
import { profilePrivacyFilterSections } from '@/features/profile/profile-shared-privacy-filter'
import { FeedCursorRouteQueryParams } from '@edenlabs/eden-sdk'

const profileAgentsFilterSections: FilterSection[] = [
  profileAgentsOwnershipFilter,
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
