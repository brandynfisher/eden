import CreatorCard from '@/components/Creators/CreatorCard'
import { useFeaturedArtists } from '@/hooks/useFeaturedArtists'
import HorizontalGallery from '@/pages/new/HorizontalGallery'
import { Skeleton } from '@mui/material'

const FeaturedArtists = () => {
  const { creators, isLoading } = useFeaturedArtists()

  return (
    <HorizontalGallery title={'Featured Artists'} url={'/creators'}>
      {(isLoading ? Array.from(new Array(10)) : creators || []).map(
        (item, index) => (
          <div key={index} className="snap-center">
            {item ? (
              <CreatorCard data={item} index={index} />
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

export default FeaturedArtists
