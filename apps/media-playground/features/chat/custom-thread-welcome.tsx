import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { AssistantV2 } from '@/types/Assistant'
import { ThreadPrimitive } from '@assistant-ui/react'

type CustomThreadWelcomeProps = {
  assistant: AssistantV2
}

const CustomThreadWelcome = ({ assistant }: CustomThreadWelcomeProps) => {
  return (
    <ThreadPrimitive.Empty>
      <div className="flex flex-grow basis-full flex-col items-center justify-center">
        <Avatar className="max-w-16">
          <AvatarImage src={getCloudfrontOriginalUrl(assistant.image)} />
          <AvatarFallback>{assistant.name}</AvatarFallback>
        </Avatar>
        <p className="mt-4 font-medium">{assistant.welcomeText}</p>
      </div>
    </ThreadPrimitive.Empty>
  )
}

export default CustomThreadWelcome
