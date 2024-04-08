import FeaturedArtistsSwiper from '@/components/Swiper/FeaturedArtistsSwiper'
import FeaturedModelsSwiper from '@/components/Swiper/FeaturedModelsSwiper'
import HighlightsSwiper from '@/components/Swiper/HighlightsSwiper'
import { Concept } from '@edenlabs/eden-sdk'

// import FeaturedCreations from '@/pages/new/FeaturedCreations'

const HomePage = ({
  highlightItems,
}: {
  highlightItems: { concept?: Concept; coverImageUri: string }[]
}) => {
  return (
    <div className="flex flex-col gap-4">
      <HighlightsSwiper items={highlightItems} />
      <FeaturedModelsSwiper />
      <FeaturedArtistsSwiper />
      {/*<FeaturedCreations />*/}
    </div>
  )
}
export default HomePage
