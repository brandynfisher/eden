import { getQueryClient } from '@/app/get-query-client'
import UserCreationsFeed from '@/components/user-creations-feed'
import { fetcher } from '@/lib/fetcher'
import { CreatorsGetResponse } from '@edenlabs/eden-sdk'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'

type Props = {
  params: {
    name: string
  }
}

const CreatorPage = ({ params }: Props) => {
  const { name } = params

  const queryClient = getQueryClient()

  queryClient.prefetchQuery({
    queryKey: ['creators', name],
    queryFn: () => fetcher<CreatorsGetResponse>(`/api/users/${name}`),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserCreationsFeed userName={name} />
    </HydrationBoundary>
  )
}

export default CreatorPage
