import Chat from '@/features/chat/chat'
import { AssistantV2 } from '@/types/Assistant'

const EvePage = () => {
  const assistant: AssistantV2 = {
    _id: '67170abeb539c335ad24067a',
    name: 'Eve',
    image: 'app/assistant/eve_512.png',
    welcomeText: 'What do you want to create today?',
  }

  return <Chat assistant={assistant} />
}

export default EvePage
