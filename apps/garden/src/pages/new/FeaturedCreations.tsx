import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import { useFeaturedCreations } from '@/hooks/useFeaturedCreations'
import HorizontalGallery from '@/pages/new/HorizontalGallery'
import { Skeleton } from '@mui/material'

const FeaturedCreations = () => {
  const { creations, isLoading } = useFeaturedCreations()

  return (
    <HorizontalGallery title={'Featured Creations'} url={'/creations'}>
      {(!isLoading ? Array.from(new Array(10)) : creations || []).map(
        (item, index) => (
          <div key={index} className="snap-center">
            {item ? (
              <CreationCard data={item} index={index} />
            ) : (
              <Skeleton
                variant="rectangular"
                className="!h-full !w-full rounded-lg aspect-square"
              />
            )}
          </div>
        ),
      )}
    </HorizontalGallery>
  )
}

export default FeaturedCreations
