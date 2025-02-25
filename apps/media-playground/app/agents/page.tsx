import UserAgentsGrid from '@/features/explore/user-agents-grid'
import UserThreadsGrid from '@/features/explore/user-threads-grid'
import SortAgentsFeed from '@/features/feed/sort-agents-feed'

const AgentsPage = () => {
  return (
    <div className="p-2 md:p-4">
      <UserThreadsGrid />

      <UserAgentsGrid />

      <SortAgentsFeed initialSort="stats.userMessageCount_7d;-1" />
    </div>
  )
}

export default AgentsPage
