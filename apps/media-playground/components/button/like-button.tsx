import { Button } from '@/components/ui/button'
import { useToggleLikeQuery } from '@/hooks/query/use-toggle-like-query'
import { cn } from '@/lib/utils'
import { QueryKey } from '@tanstack/react-query'
import { HeartIcon } from 'lucide-react'

type Props = {
  queryKey: QueryKey
  type: 'agent' | 'creation' | 'model'
  id: string
  isLiked?: boolean
  likeCount?: number
  isDropdownItem?: boolean
  className?: string
}

const LikeButton = ({
  queryKey,
  isLiked = false,
  likeCount = 0,
  type,
  id,
  isDropdownItem = false,
  className,
  ...props
}: Props) => {
  const { toggleLike } = useToggleLikeQuery({
    queryKey,
    isLiked,
    entityType: type,
  })

  const handleToggleLike = async () => {
    await toggleLike(id)
  }

  return isDropdownItem ? (
    <button
      type="button"
      className={cn('w-full', className)}
      {...props}
      onClick={handleToggleLike}
    >
      <HeartIcon
        className={cn('h-4 w-4 mr-2', isLiked && 'text-red-500')}
        fill={isLiked ? 'currentColor' : 'none'}
      />
      {likeCount}
    </button>
  ) : (
    <Button variant="outline" size="sm" onClick={handleToggleLike}>
      <HeartIcon
        className={cn('h-4 w-4 mr-2', isLiked && 'text-red-500')}
        fill={isLiked ? 'currentColor' : 'none'}
      />
      {likeCount}
    </Button>
  )
}

export default LikeButton
