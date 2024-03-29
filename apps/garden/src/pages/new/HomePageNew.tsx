import FeaturedModelsSwiper from '@/components/Swiper/FeaturedModelsSwiper'
import FeaturedArtists from '@/pages/new/FeaturedArtists'
import FeaturedCreations from '@/pages/new/FeaturedCreations'
// import FeaturedModels from '@/pages/new/FeaturedModels'
import Highlights from '@/pages/new/Highlights'

const HomePage = () => {
  return (
    <div className="flex flex-col gap-4">
      <Highlights />
      <FeaturedModelsSwiper />
      <FeaturedArtists />
      <FeaturedCreations />
    </div>
  )
}
export default HomePage
