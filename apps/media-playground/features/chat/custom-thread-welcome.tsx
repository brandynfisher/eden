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
        <Avatar className="w-16 h-16 md:w-24 md:h-24">
          <AvatarImage src={getCloudfrontOriginalUrl(assistant.image)} />
          <AvatarFallback className="w-16 h-16 md:w-24 md:h-24">
            {assistant.name}
          </AvatarFallback>
        </Avatar>

        <p className="mt-4 font-medium">{assistant.welcomeText}</p>
      </div>
    </ThreadPrimitive.Empty>
  )
}

export default CustomThreadWelcome
