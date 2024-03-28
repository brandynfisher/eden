import ConceptCard from '@/components/Concept/ConceptCard/ConceptCard'
import { useFeaturedConcepts } from '@/hooks/useFeaturedConcepts'
import HorizontalGallery from '@/pages/new/HorizontalGallery'
import { Skeleton } from '@mui/material'

const FeaturedModels = () => {
  const { concepts, isLoading } = useFeaturedConcepts()

  return (
    <HorizontalGallery title={'Featured Models'} url={'/concepts'}>
      {(isLoading ? Array.from(new Array(10)) : concepts || []).map(
        (item, index) => (
          <div key={index} className="snap-center">
            {item ? (
              <ConceptCard data={item} index={index} />
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

export default FeaturedModels
