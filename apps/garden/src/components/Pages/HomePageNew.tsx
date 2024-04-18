import CreationsFeaturedFeed from '@/components/CreationsFeaturedFeed'
import FeaturedArtistsSwiper from '@/components/Swiper/FeaturedArtistsSwiper'
import FeaturedModelsSwiper from '@/components/Swiper/FeaturedModelsSwiper'
import HighlightsSwiper, {
  HighlightItem,
} from '@/components/Swiper/HighlightsSwiper'
import { Concept, Creator } from '@edenlabs/eden-sdk'

const HomePageNew = ({
  highlightItems,
  featuredArtists,
  featuredConcepts,
}: {
  highlightItems: HighlightItem[]
  featuredArtists: Creator[]
  featuredConcepts: Concept[]
}) => {
  return (
    <div className="flex flex-col gap-6">
      <HighlightsSwiper items={highlightItems} />
      <FeaturedModelsSwiper models={featuredConcepts} />
      <FeaturedArtistsSwiper creators={featuredArtists} />
      {/*<FeaturedCreations />*/}
      <CreationsFeaturedFeed />
    </div>
  )
}
export default HomePageNew
