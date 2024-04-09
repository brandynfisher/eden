import FeaturedArtistsSwiper from '@/components/Swiper/FeaturedArtistsSwiper'
import FeaturedModelsSwiper from '@/components/Swiper/FeaturedModelsSwiper'
import HighlightsSwiper, {
  HighlightItem,
} from '@/components/Swiper/HighlightsSwiper'
import { Concept, Creator } from '@edenlabs/eden-sdk'

// import FeaturedCreations from '@/pages/new/FeaturedCreations'

const HomePage = ({
  highlightItems,
  featuredArtists,
  featuredConcepts,
}: {
  highlightItems: HighlightItem[]
  featuredArtists: Creator[]
  featuredConcepts: Concept[]
}) => {
  return (
    <div>
      <HighlightsSwiper items={highlightItems} />
      <div className="flex flex-col gap-4">
        <FeaturedModelsSwiper models={featuredConcepts} />
        <FeaturedArtistsSwiper creators={featuredArtists} />
        {/*<FeaturedCreations />*/}
      </div>
    </div>
  )
}
export default HomePage
