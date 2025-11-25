import { BaseFilter, FilterSection } from '@/components/filter/base-filter'
import { profilePrivacyFilterSections } from '@/features/profile/profile-shared-privacy-filter'
import { FeedCursorRouteQueryParams } from '@edenlabs/eden-sdk'

const profileCollectionsFilterSections: FilterSection[] = [
  profilePrivacyFilterSections,
]

interface ProfileCollectionsFilterProps {
  onChange: (filter: FeedCursorRouteQueryParams['filter']) => void
  initialFilter?: FeedCursorRouteQueryParams['filter']
  excludeFromCount?: string[]
}

export function ProfileCollectionsFilter({
  onChange,
  initialFilter,
  excludeFromCount,
}: ProfileCollectionsFilterProps) {
  return (
    <BaseFilter
      sections={profileCollectionsFilterSections}
      onChange={onChange}
      initialFilter={initialFilter}
      excludeFromCount={excludeFromCount}
    />
  )
}
