import FeaturedArtistsSwiper from '@/components/Swiper/FeaturedArtistsSwiper'
import FeaturedModelsSwiper from '@/components/Swiper/FeaturedModelsSwiper'
import HighlightsSwiper, {
  HighlightItem,
} from '@/components/Swiper/HighlightsSwiper'

// import FeaturedCreations from '@/pages/new/FeaturedCreations'

const HomePage = ({ highlightItems }: { highlightItems: HighlightItem[] }) => {
  return (
    <div>
      <HighlightsSwiper items={highlightItems} />
      <div className="flex flex-col gap-4">
        <FeaturedModelsSwiper />
        <FeaturedArtistsSwiper />
        {/*<FeaturedCreations />*/}
      </div>
    </div>
  )
}
export default HomePage
