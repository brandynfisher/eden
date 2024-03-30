import FeaturedArtistsSwiper from '@/components/Swiper/FeaturedArtistsSwiper'
import FeaturedModelsSwiper from '@/components/Swiper/FeaturedModelsSwiper'
import HighlightsSwiper from '@/components/Swiper/HighlightsSwiper'
import FeaturedCreations from '@/pages/new/FeaturedCreations'

const HomePage = () => {
  return (
    <div className="flex flex-col gap-4">
      <HighlightsSwiper />
      <FeaturedModelsSwiper />
      <FeaturedArtistsSwiper />
      <FeaturedCreations />
    </div>
  )
}
export default HomePage
