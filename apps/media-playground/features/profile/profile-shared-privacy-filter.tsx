import { FilterSection } from '@/components/filter/base-filter'
import { FeedCursorRouteQueryParams } from '@edenlabs/eden-sdk'
import { LockOpenIcon } from 'lucide-react'
import { LockIcon } from 'lucide-react'

export const profilePrivacyFilterSections: FilterSection = {
  id: 'isPrivate' as keyof FeedCursorRouteQueryParams['filter'],
  label: 'Privacy',
  items: [
    { id: 'true', name: 'Private', icon: <LockIcon className="h-4 w-4" /> },
    {
      id: 'false',
      name: 'Public',
      icon: <LockOpenIcon className="h-4 w-4" />,
    },
  ],
  canHaveMultipleValues: false,
}
