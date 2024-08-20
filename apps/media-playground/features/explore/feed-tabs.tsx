import RouterTabs from '@/components/tabs/router-tabs'
import CreationsFeed from '@/features/feed/creations-feed'
import ModelsFeed from '@/features/feed/models-feed'

const FeedTabs = () => {
  const tabs = [
    {
      key: 'creations',
      title: 'Creations',
      content: <CreationsFeed maxCols={7} />,
    },
    {
      key: 'models',
      title: 'Models',
      content: <ModelsFeed minCols={1} maxCols={4} />,
    },
    // {
    //   key: 'collections',
    //   title: 'Collections',
    //   content: <div>collections</div>,
    // },
  ]

  return <RouterTabs tabs={tabs} />
}

export default FeedTabs
