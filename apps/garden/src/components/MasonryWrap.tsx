import { OrderByParam } from '@/components/Layout/buttons/OrderByButtons'
import MasonryV2 from '@/components/MasonryV2'
import { PaginatedFeedQuery, useFeedPaginated } from '@/hooks/useFeedPaginated'

const MasonryWrap = ({
  type,
  query,
  orderBy,
}: {
  type: 'creations' | 'concepts'
  query?: PaginatedFeedQuery
  orderBy: OrderByParam
}) => {
  const {
    items,
    // maybeLoadMore: maybeLoadNextPage,
    // setSize,
    // isEmpty,
    // hasNextPage,
  } = useFeedPaginated(type, query, orderBy)

  return (
    <div>
      <div>MasonryV2</div>

      <div>[Type]: {type}</div>
      <div>[Query]: {JSON.stringify(query)}</div>
      <div>[orderBy]: {JSON.stringify(orderBy.label)}</div>

      {items && items.length ? (
        <MasonryV2
          key={`${type}`}
          items={items}
          // type={type}
        />
      ) : (
        <div>Empty</div>
      )}
    </div>
  )
}

export default MasonryWrap
