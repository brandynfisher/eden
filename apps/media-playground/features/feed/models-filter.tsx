import { BaseFilter, FilterSection } from '@/components/filter/base-filter'
import { FeedCursorRouteQueryParams } from '@edenlabs/eden-sdk'

const modelSections: FilterSection[] = [
  {
    id: 'base_model' as keyof FeedCursorRouteQueryParams['filter'],
    label: 'Base Model',
    items: [
      {
        id: 'flux-dev',
        name: 'Flux DEV',
      },
      {
        id: 'sdxl',
        name: 'SDXL',
      },
    ],
  },
]

interface ModelsFilterProps {
  onChange: (filter: FeedCursorRouteQueryParams['filter']) => void
  initialFilter?: FeedCursorRouteQueryParams['filter']
}

export function ModelsFilter({ onChange, initialFilter }: ModelsFilterProps) {
  return (
    <BaseFilter
      sections={modelSections}
      onChange={onChange}
      initialFilter={initialFilter}
    />
  )
}
