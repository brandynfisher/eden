import { FilterSection } from '@/components/filter/base-filter'
import { FeedCursorRouteQueryParams } from '@edenlabs/eden-sdk'
import { UserIcon, UsersIcon } from 'lucide-react'

export const profileAgentsOwnershipFilter: FilterSection = {
  id: 'ownership' as keyof FeedCursorRouteQueryParams['filter'],
  label: 'Ownership',
  items: [
    { id: 'owned', name: 'My Agents', icon: <UserIcon className="h-4 w-4" /> },
    {
      id: 'shared',
      name: 'Shared with Me',
      icon: <UsersIcon className="h-4 w-4" />,
    },
  ],
  canHaveMultipleValues: false,
}