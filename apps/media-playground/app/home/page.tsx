import { ChatMockWidget } from '@/features/chat/chat-mock-widget'
import { Footer } from '@/features/landing/footer'

const HomePage = () => {
  return (
    <div className="flex flex-col items-center h-full justify-between flex-grow">
      <div className="max-w-3xl flex flex-col flex-grow justify-center">
        <h1 className="text-2xl font-semibold mt-12 mb-4">Welcome</h1>
        <div className="min-w-[320px] flex flex-col p-4 border border-secondary rounded-md">
          <ChatMockWidget />
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default HomePage
