import FeaturedArtists from '@/pages/new/FeaturedArtists'
import FeaturedCreations from '@/pages/new/FeaturedCreations'
import FeaturedModels from '@/pages/new/FeaturedModels'
import HighlightCard from '@/pages/new/HighlightCard'

const HomePage = () => {
  return (
    <div className="flex flex-col gap-4">
      <div className="mb-4">
        <h2 className="mb-2">Highlight</h2>
        <HighlightCard />
      </div>
      <FeaturedModels />
      <FeaturedArtists />
      <FeaturedCreations />
    </div>
  )
}
export default HomePage
