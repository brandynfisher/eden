import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { HeartIcon } from 'lucide-react'

type Props = {
  isLiked?: boolean
  likeCount?: number
  onChange: () => void
}

const LikeButton = ({ isLiked = false, likeCount = 0, onChange }: Props) => {
  return (
    <Button variant="outline" size="sm" onClick={onChange}>
      <HeartIcon
        className={cn('h-4 w-4 mr-2', isLiked && 'text-red-500')}
        fill={isLiked ? 'currentColor' : 'none'}
      />
      {likeCount}
    </Button>
  )
}

export default LikeButton
