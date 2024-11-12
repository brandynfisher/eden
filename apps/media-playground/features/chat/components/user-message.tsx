import { BranchPicker, UserActionBar, UserMessage } from '@assistant-ui/react'
import type { FC } from 'react'

const MyUserMessage: FC = () => {
  return (
    <UserMessage.Root>
      <UserMessage.Attachments />
      <UserMessage.Content />
      <BranchPicker />
      <UserActionBar />
    </UserMessage.Root>
  )
}

export default MyUserMessage
