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
    canHaveMultipleValues: true,
  },
]

interface ModelsFilterProps {
  onChange: (filter: FeedCursorRouteQueryParams['filter']) => void
  initialFilter?: FeedCursorRouteQueryParams['filter']
  className?: string
}

export function ModelsFilter({
  onChange,
  initialFilter,
  className,
}: ModelsFilterProps) {
  return (
    <BaseFilter
      className={className}
      sections={modelSections}
      onChange={onChange}
      initialFilter={initialFilter}
    />
  )
}
