import { Badge } from '@/components/ui/badge'
import { CollectionItem } from '@/types/collection'
import Image from 'next/image'

interface CreationCardProps {
  item: CollectionItem
}

export const CreationCard = ({ item }: CreationCardProps) => {
  return (
    <div
      key={item._id}
      className="aspect-square relative overflow-hidden rounded-lg"
    >
      <Image
        src={item.thumbnail}
        alt={item.name}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
      />
      {item.mediaAttributes.mimeType.startsWith('video') && (
        <Badge className="absolute bottom-2 right-2" variant="secondary">
          {Math.round(item.mediaAttributes.duration || 0)}s
        </Badge>
      )}
    </div>
  )
}
