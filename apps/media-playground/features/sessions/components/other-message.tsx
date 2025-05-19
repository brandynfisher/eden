import { MarkdownText } from './markdown-text'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserIcon } from 'lucide-react'

interface Message {
  content: string
  sender?: {
    userImage: string
  }
}

export const OtherMessage = ({ message }: { message: Message }) => {
  return (
    <div className="flex justify-start">
      <div className="aui-assistant-message-root block px-2 md:grid">
        <div className="flex items-center md:items-start mr-2">
          <Avatar className="w-12 h-12">
            <AvatarImage src={message.sender?.userImage} />
            <AvatarFallback>
              <UserIcon className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="aui-assistant-message-content mt-1.5 pl-3 pr-2 max-w-full">
          <MarkdownText>{message.content}</MarkdownText>
        </div>
      </div>
    </div>
  )
}
