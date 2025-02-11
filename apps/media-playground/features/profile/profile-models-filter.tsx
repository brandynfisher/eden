import { BaseFilter, FilterSection } from '@/components/filter/base-filter'
import { profilePrivacyFilterSections } from '@/features/profile/profile-shared-privacy-filter'
import { FeedCursorRouteQueryParams } from '@edenlabs/eden-sdk'

const profileModelsFilterSections: FilterSection[] = [
  profilePrivacyFilterSections,
  {
    id: 'base_model' as keyof FeedCursorRouteQueryParams['filter'],
    label: 'Base Model',
    items: [
      { id: 'flux-dev', name: 'Flux DEV' },
      { id: 'sdxl', name: 'SDXL' },
    ],
    canHaveMultipleValues: true,
  },
]

interface ProfileModelsFilterProps {
  onChange: (filter: FeedCursorRouteQueryParams['filter']) => void
  initialFilter?: FeedCursorRouteQueryParams['filter']
}

export function ProfileModelsFilter({
  onChange,
  initialFilter,
}: ProfileModelsFilterProps) {
  return (
    <BaseFilter
      sections={profileModelsFilterSections}
      onChange={onChange}
      initialFilter={initialFilter}
    />
  )
}
