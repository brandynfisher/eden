import { ChatMockWidget } from '@/features/chat/chat-mock-widget'
import { Footer } from '@/features/landing/footer'

const HomePage = () => {
  return (
    <div className="flex flex-col items-center h-full justify-between flex-grow">
      <div className="max-w-lg flex flex-col flex-grow justify-center w-full">
        {/* <h1 className="text-2xl font-semibold mt-12 mb-4">Welcome</h1> */}
        <div className="min-w-[320px] flex flex-col p-4 border border-purple-600/25 rounded-md bg-muted-darker/50">
          <ChatMockWidget />
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default HomePage
