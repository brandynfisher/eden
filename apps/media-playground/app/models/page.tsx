import UserModelsGrid from '@/features/explore/user-models-grid'
import SortModelsFeed from '@/features/feed/sort-models-feed'

const ModelsPage = () => {
  return (
    <div className="p-2 md:p-4">
      <UserModelsGrid />

      <SortModelsFeed />
    </div>
  )
}

export default ModelsPage
