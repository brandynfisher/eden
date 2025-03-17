import { Badge } from '@/components/ui/badge'
import { CreationV2 } from '@edenlabs/eden-sdk'
import Image from 'next/image'

interface CreationCardProps {
  item: CreationV2
}

export const CreationCard = ({ item }: CreationCardProps) => {
  return (
    <div
      key={item._id}
      className="aspect-square relative overflow-hidden rounded-lg"
    >
      <Image
        src={item.thumbnail || ''}
        alt={'creation'}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
      />
      {item.mediaAttributes?.mimeType.startsWith('video') && (
        <Badge className="absolute bottom-2 right-2" variant="secondary">
          {Math.round(item.mediaAttributes?.duration || 0)}s
        </Badge>
      )}
    </div>
  )
}
