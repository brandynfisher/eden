import { Button } from '@/components/ui/button'
import { useToggleLikeQuery } from '@/hooks/query/use-toggle-like-query'
import { cn } from '@/lib/utils'
import { HeartIcon } from 'lucide-react'
import React from 'react'

type Props = {
  type: 'agent' | 'creation' | 'model'
  id: string
  isLiked?: boolean
  likeCount?: number
  isDropdownItem?: boolean
  className?: string
  docQueryKeyId?: string
  disabled?: boolean
}

const LikeButton = ({
  isLiked = false,
  likeCount = 0,
  type,
  id,
  docQueryKeyId,
  isDropdownItem = false,
  className,
  disabled = false,
  ...props
}: Props) => {
  const { toggleLike } = useToggleLikeQuery({
    isLiked,
    entityType: type,
    entityId: id,
    docQueryKeyId,
  })

  const handleToggleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    await toggleLike()
  }

  return isDropdownItem ? (
    <button
      type="button"
      className={cn(
        'w-full',
        className,
        disabled && 'disabled:opacity-50 disabled:pointer-events-none',
      )}
      {...props}
      onClick={handleToggleLike}
      disabled={disabled}
    >
      <HeartIcon
        className={cn('h-4 w-4 mr-2', isLiked && 'text-red-500')}
        fill={isLiked ? 'currentColor' : 'none'}
      />
      {likeCount}
    </button>
  ) : (
    <Button
      className={cn(className, disabled && 'disabled:opacity-100')}
      variant="outline"
      size="sm"
      onClick={handleToggleLike}
      disabled={disabled}
    >
      <HeartIcon
        className={cn('h-4 w-4 mr-2', isLiked && 'text-red-500')}
        fill={isLiked ? 'currentColor' : 'none'}
      />
      {likeCount}
    </Button>
  )
}

export default LikeButton
